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
import PalettePreviewDialog from "@/components/PalettePreviewDialog";
import { generatePalette, convert, type PaletteStep } from "@/lib/color";
import { type ColorModel, MODEL_LABELS } from "@/lib/constants";
import { type PresetPalette } from "@/lib/presets";
import PresetDrawer from "@/components/PresetDrawer";
import PaletteSaveDialog from "@/components/PaletteSaveDialog";
import { HexColorPicker } from "react-colorful";
import { sileo } from "sileo";
import {
	ArrowCounterClockwiseIcon,
	LinkSimpleIcon,
	DownloadSimpleIcon,
	CopySimpleIcon,
	PaletteIcon,
	BookmarkSimpleIcon,
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

	const [loadedPreset, setLoadedPreset] = useState<PresetPalette | null>(null);
	const [showPicker, setShowPicker] = useState(false);
	const [presetDrawerOpen, setPresetDrawerOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [saveOpen, setSaveOpen] = useState(false);
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

	const handlePresetSelect = useCallback((preset: PresetPalette) => {
		const mid = preset.colors[Math.floor(preset.colors.length / 2)];
		setSeed(mid.hex);
		setDisplayModel("oklch");
		setLoadedPreset(preset);
	}, []);

	const handleColorPick = useCallback((hex: string) => {
		setSeed(hex);
		setLoadedPreset(null);
	}, []);

	const handleReset = useCallback(() => {
		setSeed(DEFAULT_SEED);
		setDisplayModel(DEFAULT_MODEL);
		setLoadedPreset(null);
	}, []);

	const handleShare = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			sileo.success({ title: "URL copied" });
		} catch {}
	}, []);

	const handleDownloadImage = useCallback(() => {
		setPreviewOpen(true);
	}, []);

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
					onClick={handleDownloadImage}
					className="text-background/60 hover:text-muted"
					aria-label="Download palette image"
				>
					<DownloadSimpleIcon size={14} />
					<span className="hidden md:inline">Download</span>
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
					onClick={() => setSaveOpen(true)}
					className="text-background/60 hover:text-muted"
					aria-label="Save palette"
				>
					<BookmarkSimpleIcon size={14} />
					<span className="hidden md:inline">Save</span>
				</Button>
			</div>,
		);
		return () => setContent(null);
	}, [handleReset, handleShare, handleDownloadImage, setContent]);

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

	const copyStepValue = useCallback(
		async (i: number, value: string) => {
			try {
				await navigator.clipboard.writeText(value);
				const step = steps[i];
				sileo.success({
					title: `Copied step ${i}`,
					icon: <CopySimpleIcon size={16} />,
					description: step ? (
						<span className="flex items-center gap-2">
							<span
								className="inline-block size-4 shrink-0 rounded-sm border border-border"
								style={{ background: step.hex }}
							/>
							{value}
						</span>
					) : undefined,
				});
			} catch {}
		},
		[steps],
	);

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
			<div className="w-full max-w-2xl flex flex-col gap-4">
				<div className="flex items-center gap-3 w-full">
					<div className="relative flex items-center shrink-0">
						<button
							type="button"
							onClick={() => setShowPicker((p) => !p)}
							className="shrink-0 cursor-pointer h-9 border border-border"
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

				<div className="flex items-center gap-2 min-h-[24px]">
					<button
						type="button"
						onClick={() => setPresetDrawerOpen(true)}
						className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
						aria-label="Browse preset palettes"
					>
						<PaletteIcon size={12} />
						<span>Browse presets</span>
					</button>
					{loadedPreset && (
						<div className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded-sm bg-muted/50 text-muted-foreground border border-border/50">
							<span>{loadedPreset.source} — {loadedPreset.name}</span>
							<button
								type="button"
								onClick={() => setLoadedPreset(null)}
								className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer leading-none"
								aria-label="Clear preset"
							>
								×
							</button>
						</div>
					)}
				</div>
			</div>

			<PresetDrawer
				open={presetDrawerOpen}
				onClose={() => setPresetDrawerOpen(false)}
				onSelectPreset={handlePresetSelect}
			/>

			{loadedPreset ? (
				<>
					<div className="w-full max-w-2xl flex rounded-sm overflow-hidden border border-border/50">
						{loadedPreset.colors.map((c, i) => (
							<button
								type="button"
								key={i}
								onClick={() => {
									navigator.clipboard.writeText(c.hex);
									sileo.success({
										title: "Copied",
										icon: <CopySimpleIcon size={16} />,
										description: (
											<span className="flex items-center gap-2">
												<span
													className="inline-block size-4 shrink-0 rounded-sm border border-border"
													style={{ background: c.hex }}
												/>
												{c.hex}
											</span>
										),
									});
								}}
								className="flex-1 h-10 md:h-14 relative cursor-pointer hover:opacity-90 transition-opacity"
								style={{ background: c.hex }}
								title={`${c.label}: ${c.hex}`}
								aria-label={`Copy ${c.label}`}
							/>
						))}
					</div>
					<div className="w-full max-w-2xl flex flex-col gap-px font-mono text-xs">
						<div
							className={`grid gap-2 px-3 py-1.5 text-muted-foreground/50 uppercase tracking-wider ${displayModel !== "hex" ? "grid-cols-[3rem_1fr_5rem_2rem]" : "grid-cols-[3rem_1fr_2rem]"}`}
						>
							<span>Step</span>
							<span>
								{displayModel !== "hex" ? MODEL_LABELS[displayModel] : "Hex"}
							</span>
							{displayModel !== "hex" && (
								<span className="text-right">Hex</span>
							)}
							<span />
						</div>
						{loadedPreset.colors.map((c) => {
							const displayVal = convert(c.hex, "hex", displayModel) ?? c.hex;
							return (
								<div
									key={c.label}
									className={`grid gap-2 items-center px-3 py-2 rounded-sm hover:bg-muted/30 transition-colors ${displayModel !== "hex" ? "grid-cols-[3rem_1fr_5rem_2rem]" : "grid-cols-[3rem_1fr_2rem]"}`}
								>
									<div className="flex items-center gap-2">
										<div
											className="w-6 h-6 rounded-sm shrink-0 border border-border/30"
											style={{ background: c.hex }}
										/>
										<span className="text-muted-foreground">{c.label}</span>
									</div>
									<span className="truncate text-foreground tracking-tight">
										{displayVal}
									</span>
									{displayModel !== "hex" && (
										<span className="truncate text-right text-muted-foreground">
											{c.hex}
										</span>
									)}
									<button
										onClick={() => {
											navigator.clipboard.writeText(displayVal);
											sileo.success({
												title: "Copied",
												description: displayVal,
											});
										}}
										className="justify-self-end shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
										aria-label={`Copy ${c.label}`}
									>
										<CopySimpleIcon size={12} />
									</button>
								</div>
							);
						})}
					</div>
				</>
			) : steps.length === 0 ? (
				<p className="text-muted-foreground font-mono text-sm">
					Enter a valid color to generate a palette.
				</p>
			) : (
				<>
					<div className="w-full max-w-2xl flex rounded-sm overflow-hidden border border-border/50">
						{steps.map((s) => {
							const displayVal = s[displayModel as keyof PaletteStep] as string;
							return (
								<button
									type="button"
									key={s.index}
									onClick={() => copyStepValue(s.index, displayVal)}
									className={`flex-1 h-10 md:h-14 relative cursor-pointer ${s.index === seedStep ? "ring-1 ring-inset ring-foreground/40" : ""}`}
									style={{ background: s.hex }}
									title={`${s.index}: ${displayVal}`}
									aria-label={`Copy step ${s.index}`}
								>
									{s.index === seedStep && (
										<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
											<div className="w-2 h-2 rounded-full bg-foreground ring-[1.5px] ring-background" />
										</div>
									)}
								</button>
							);
						})}
					</div>

					<div className="w-full max-w-2xl flex flex-col gap-px font-mono text-xs">
						{displayModel !== "hex" ? (
							<div className="grid grid-cols-[3rem_1fr_5rem_2rem] gap-2 px-3 py-1.5 text-muted-foreground/50 uppercase tracking-wider">
								<span>Step</span>
								<span>{MODEL_LABELS[displayModel]}</span>
								<span className="text-right">Hex</span>
								<span />
							</div>
						) : (
							<div className="grid grid-cols-[3rem_1fr_2rem] gap-2 px-3 py-1.5 text-muted-foreground/50 uppercase tracking-wider">
								<span>Step</span>
								<span>Hex</span>
								<span />
							</div>
						)}
						{steps.map((s) => {
							const displayVal = s[displayModel as keyof PaletteStep] as string;
							return (
								<div
									key={s.index}
									className={`grid gap-2 items-center px-3 py-2 rounded-sm hover:bg-muted/30 transition-colors ${displayModel !== "hex" ? "grid-cols-[3rem_1fr_5rem_2rem]" : "grid-cols-[3rem_1fr_2rem]"}`}
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
									{displayModel !== "hex" && (
										<span className="truncate text-right text-muted-foreground">
											{s.hex}
										</span>
									)}
									<button
										onClick={() => copyStepValue(s.index, displayVal)}
										className="justify-self-end shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
										aria-label={`Copy step ${s.index}`}
									>
										<CopySimpleIcon size={12} />
									</button>
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
			<PalettePreviewDialog
				open={previewOpen}
				onOpenChangeAction={setPreviewOpen}
				steps={steps}
				seedStep={seedStep}
				displayModel={displayModel}
			/>
			<PaletteSaveDialog
				open={saveOpen}
				onOpenChange={setSaveOpen}
				seed={seed}
			/>
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
