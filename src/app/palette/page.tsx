"use client";

import {
	Suspense,
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ColorSwatch from "@/components/ColorSwatch";
import ColorInput from "@/components/ColorInput";
import { GamutBadge } from "@/components/GamutBadge";
import { useActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generatePalette, convert, type PaletteStep } from "@/lib/color";
import { type ColorModel, MODEL_LABELS } from "@/lib/constants";
import { HexColorPicker } from "react-colorful";
import { sileo } from "sileo";
import {
	ArrowCounterClockwiseIcon,
	LinkSimpleIcon,
	DownloadSimpleIcon,
	CopySimpleIcon,
} from "@phosphor-icons/react";

const DEFAULT_SEED = "#1a2b3c";
const DEFAULT_MODEL: ColorModel = "oklch";

const TAILWIND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function formatCSS(steps: PaletteStep[], model: ColorModel): string {
	return `:root {\n${steps
		.map((s) => {
			const val = s[model as keyof PaletteStep] as string;
			return `  --step-${s.index}: ${val};`;
		})
		.join("\n")}\n}`;
}

function formatTailwind(steps: PaletteStep[], model: ColorModel): string {
	return `@theme inline {\n${steps
		.map((s, i) => {
			const val = s[model as keyof PaletteStep] as string;
			return `  --color-brand-${TAILWIND_STEPS[i]}: ${val};`;
		})
		.join("\n")}\n}`;
}

function formatJSON(steps: PaletteStep[]): string {
	return JSON.stringify(
		steps.map((s) => ({
			index: s.index,
			hex: s.hex,
			rgb: s.rgb,
			hsl: s.hsl,
			oklch: s.oklch,
			oklab: s.oklab,
			lch: s.lch,
		})),
		null,
		2,
	);
}

function downloadSVG(steps: PaletteStep[]): void {
	const swatchH = 32;
	const gap = 4;
	const totalH = steps.length * (swatchH + gap) - gap;
	const swatchW = 200;
	const fontSize = 11;

	const rects = steps
		.map(
			(s, i) =>
				`<rect x="0" y="${i * (swatchH + gap)}" width="${swatchW}" height="${swatchH}" fill="${s.hex}" rx="3" />` +
				`<text x="${swatchW - 8}" y="${i * (swatchH + gap) + swatchH / 2 + 1}" text-anchor="end" font-family="monospace" font-size="${fontSize}" fill="${i < 5 ? "#000" : "#fff"}">${s.hex}</text>`,
		)
		.join("");

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${swatchW}" height="${totalH}">${rects}</svg>`;
	const blob = new Blob([svg], { type: "image/svg+xml" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "palette.svg";
	a.click();
	URL.revokeObjectURL(url);
}

function PalettePageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { setContent } = useActionBar();

	const [seed, setSeed] = useState(() => {
		return searchParams.get("seed") ?? DEFAULT_SEED;
	});

	const [displayModel, setDisplayModel] = useState<ColorModel>(() => {
		const m = searchParams.get("display");
		if (m && ["hex", "rgb", "hsl", "oklch", "oklab", "lch"].includes(m)) {
			return m as ColorModel;
		}
		return DEFAULT_MODEL;
	});

	const [showPicker, setShowPicker] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);

	const pickerColor = useMemo(
		() => (seed && /^#[0-9a-f]{6}/i.test(seed) ? seed : DEFAULT_SEED),
		[seed],
	);

	useEffect(() => {
		if (!showPicker) return;
		const close = (e: MouseEvent) => {
			if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
				setShowPicker(false);
			}
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, [showPicker]);

	const { steps, seedStep } = useMemo(() => generatePalette(seed), [seed]);

	const syncUrl = useCallback(
		(s: string, m: ColorModel) => {
			const params = new URLSearchParams();
			params.set("seed", s);
			params.set("display", m);
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[router, pathname],
	);

	useEffect(() => {
		syncUrl(seed, displayModel);
	}, [seed, displayModel, syncUrl]);

	const handleColorPick = useCallback((hex: string) => {
		setSeed(hex);
	}, []);

	const handleReset = useCallback(() => {
		setSeed(DEFAULT_SEED);
		setDisplayModel(DEFAULT_MODEL);
	}, []);

	const handleShare = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			sileo.success({ title: "URL copied" });
		} catch {}
	}, []);

	const handleDownloadImage = useCallback(() => {
		downloadSVG(steps);
		sileo.success({ title: "Image downloaded" });
	}, [steps]);

	useEffect(() => {
		setContent(
			<div className="flex items-center gap-3">
				<Button
					variant="bare"
					size="sm"
					onClick={handleReset}
					className="text-background/60 hover:text-muted"
					aria-label="Reset to default color"
				>
					<ArrowCounterClockwiseIcon size={14} />
					<span className="hidden md:inline">Reset</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={handleShare}
					className="text-background/60 hover:text-muted"
					aria-label="Copy share URL"
				>
					<LinkSimpleIcon size={14} />
					<span className="hidden md:inline">Share</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={handleDownloadImage}
					className="text-background/60 hover:text-muted"
					aria-label="Download palette as SVG"
				>
					<DownloadSimpleIcon size={14} />
					<span className="hidden md:inline">Download</span>
				</Button>
			</div>,
		);
		return () => setContent(null);
	}, [
		handleReset,
		handleShare,
		handleDownloadImage,
		setContent,
	]);

	const [activeTab, setActiveTab] = useState("css");

	const copyTabContent = useCallback(async () => {
		let text = "";
		if (activeTab === "css") text = formatCSS(steps, displayModel);
		else if (activeTab === "tailwind")
			text = formatTailwind(steps, displayModel);
		else text = formatJSON(steps);
		try {
			await navigator.clipboard.writeText(text);
			sileo.success({ title: "Copied" });
		} catch {}
	}, [activeTab, steps, displayModel]);

	const copyStepValue = useCallback(async (_i: number, value: string) => {
		try {
			await navigator.clipboard.writeText(value);
			sileo.success({ title: "Copied" });
		} catch {}
	}, []);

	const displayValue = useMemo(
		() => convert(seed, "hex", displayModel) ?? seed,
		[seed, displayModel],
	);

	const handleDisplayValueChange = useCallback(
		(v: string) => {
			const newHex = convert(v, displayModel, "hex");
			if (newHex) setSeed(newHex);
		},
		[displayModel],
	);

	return (
		<section className="min-h-[calc(100dvh-88px)] h-full w-full max-w-7xl m-auto flex flex-col px-4 pt-24 pb-32 gap-6 items-center justify-start">
			<div className="flex items-center gap-3 w-full max-w-xl">
				<div className="relative flex items-center shrink-0">
					<button
						type="button"
						onClick={() => setShowPicker((p) => !p)}
						className="shrink-0 cursor-pointer h-9"
						aria-label="Pick a seed color"
					>
						<ColorSwatch color={seed} size="sm" />
					</button>
					{showPicker && (
						<div
							ref={pickerRef}
							className="absolute top-full left-0 mt-2 z-50 p-1.5 border border-border rounded-xl bg-background"
						>
							<HexColorPicker
								color={pickerColor}
								onChange={handleColorPick}
								className="rounded-lg"
							/>
						</div>
					)}
				</div>
				<ColorInput
					value={displayValue}
					model={displayModel}
					onValueChange={handleDisplayValueChange}
					onModelChange={(m) => setDisplayModel(m)}
				/>
			</div>

			<GamutBadge value={seed} />

			{steps.length === 0 ? (
				<p className="text-muted-foreground font-mono text-sm">
					Enter a valid color to generate a palette.
				</p>
			) : (
				<>
					<div className="w-full max-w-2xl flex rounded-sm overflow-hidden border border-border/50">
						{steps.map((s) => (
							<div
								key={s.index}
								className={`flex-1 h-10 md:h-14 relative ${s.index === seedStep ? "ring-1 ring-inset ring-foreground/40" : ""}`}
								style={{ background: s.hex }}
								title={`${s.index}: ${s[displayModel as keyof PaletteStep] as string}`}
							>
								{s.index === seedStep && (
									<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
										<div className="w-2 h-2 rounded-full bg-foreground ring-[1.5px] ring-background" />
									</div>
								)}
							</div>
						))}
					</div>

					<div className="w-full max-w-2xl flex flex-col gap-px font-mono text-xs">
						<div className="grid grid-cols-[3rem_1fr_5rem] gap-2 px-3 py-1.5 text-muted-foreground/50 uppercase tracking-wider">
							<span>Step</span>
							<span>{MODEL_LABELS[displayModel]}</span>
							{displayModel !== "hex" && (
								<span className="text-right">Hex</span>
							)}
						</div>
						{steps.map((s) => {
							const displayVal = s[displayModel as keyof PaletteStep] as string;
							return (
								<div
									key={s.index}
									className="grid grid-cols-[3rem_1fr_5rem] gap-2 items-center px-3 py-2 rounded-sm hover:bg-muted/30 transition-colors"
								>
									<div className="flex items-center gap-2">
										<div
											className="w-6 h-6 rounded-sm shrink-0 border border-border/30"
											style={{ background: s.hex }}
										/>
										<span
											className={`text-muted-foreground relative ${s.index === seedStep ? "after:absolute after:-right-2.5 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-1 after:rounded-full after:bg-foreground/60" : ""}`}
										>
											{s.index}
										</span>
									</div>
									<span className="truncate text-foreground tracking-tight">
										{displayVal}
									</span>
									{displayModel !== "hex" ? (
										<div className="flex items-center gap-1 justify-end">
											<span className="truncate text-muted-foreground">
												{s.hex}
											</span>
											<button
												onClick={() => copyStepValue(s.index, displayVal)}
												className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
												aria-label={`Copy step ${s.index}`}
											>
												<CopySimpleIcon size={12} />
											</button>
										</div>
									) : (
										<div className="flex items-center gap-1 justify-end">
											<button
												onClick={() => copyStepValue(s.index, displayVal)}
												className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
												aria-label={`Copy step ${s.index}`}
											>
												<CopySimpleIcon size={12} />
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</>
			)}

			<div className="w-full max-w-2xl">
				<Tabs defaultValue="css" onValueChange={setActiveTab}>
					<div className="flex items-center justify-between mb-2">
						<TabsList variant="line">
							<TabsTrigger value="css">CSS</TabsTrigger>
							<TabsTrigger value="tailwind">Tailwind</TabsTrigger>
							<TabsTrigger value="json">JSON</TabsTrigger>
						</TabsList>
						<Button
							variant="bare"
							size="xs"
							onClick={copyTabContent}
							aria-label="Copy code"
						>
							{"Copy"}
						</Button>
					</div>
					<TabsContent value="css">
						<pre className="p-3 rounded-sm bg-muted/30 border border-border overflow-x-auto text-muted-foreground font-mono text-xs">
							{formatCSS(steps, displayModel)}
						</pre>
					</TabsContent>
					<TabsContent value="tailwind">
						<pre className="p-3 rounded-sm bg-muted/30 border border-border overflow-x-auto text-muted-foreground font-mono text-xs">
							{formatTailwind(steps, displayModel)}
						</pre>
					</TabsContent>
					<TabsContent value="json">
						<pre className="p-3 rounded-sm bg-muted/30 border border-border overflow-x-auto text-muted-foreground font-mono text-xs max-h-96 overflow-y-auto">
							{formatJSON(steps)}
						</pre>
					</TabsContent>
				</Tabs>
			</div>
		</section>
	);
}

export default function PalettePage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
					Loading...
				</div>
			}
		>
			<PalettePageContent />
		</Suspense>
	);
}
