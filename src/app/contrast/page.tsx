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
import ColorInput from "@/components/ColorInput";
import ColorSwatch from "@/components/ColorSwatch";
import { useActionBar } from "@/components/ActionBar";
import { lightnessOf } from "@/lib/colors";
import { Button } from "@/components/ui/button";
import { convert } from "@/lib/color";
import {
	WCAG_THRESHOLDS,
	evaluateContrast,
	suggestPassingColor,
	suggestPassingColorMulti,
	wcagRatio,
} from "@/lib/contrast";
import {
	analyzeGradientContrast,
	solveScrim,
} from "@/lib/gradient-contrast";
import { downloadContrastCard } from "@/lib/export-image";
import { mixColors } from "@/lib/color";
import GradientBar from "@/components/gradient/GradientBar";
import StopRow from "@/components/gradient/StopRow";
import ScrubInput from "@/components/gradient/ScrubInput";
import SegmentedControl from "@/components/names/SegmentedControl";
import type { GradientStop } from "@/components/gradient/types";
import type { ColorModel } from "@/lib/constants";
import { HexAlphaColorPicker } from "react-colorful";
import { sileo } from "sileo";
import {
	CopySimpleIcon,
	CheckCircleIcon,
	XCircleIcon,
	LinkSimpleIcon,
	ArrowsLeftRightIcon,
	SwapIcon,
	CheckIcon,
	PlusCircleIcon,
	CompassIcon,
	SlidersHorizontalIcon,
	XIcon,
	DownloadSimpleIcon,
} from "@phosphor-icons/react";

const DEFAULT_FG = "#ffffff";
const DEFAULT_BG = "#0a0a0a";

const TYPEFACE_STACK = {
	system: undefined,
	serif: 'Georgia, "Times New Roman", Times, serif',
	arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
	trebuchet: '"Trebuchet MS", "Segoe UI", Tahoma, sans-serif',
	mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
} as const;

type FontChoice = keyof typeof TYPEFACE_STACK;

const COPY_PACKS = {
	article: {
		heading: "The weight of a small press",
		decor: "The quiet people",
		body: "The press\u2019s smallest fire ran on sawdust and ritual. By dawn the foreman always arrived before the boiler did, not because the work demanded it, but because the machine\u2019s indifference was, somehow, easier when it was witnessed.",
		caps: "SECOND",
	},
	ui: {
		heading: "Notification — critical",
		decor: "Action required",
		body: "The account you manage will be archived tonight at midnight UTC. 3 dependent services will lose access. Reassign ownership to any remaining team member before then or export data to a compliant archive first.",
		caps: "COPY",
	},
	legal: {
		heading: "Terms at a glance",
		decor: "§ 4. Governing law",
		body: "This Agreement shall be governed by the laws of the Republic of the Philippines, excluding its conflict-of-laws rules, together with applicable mandatory international treaties. Any dispute arising under this Agreement shall be settled exclusively by arbitration in the City of Manila before at least one arbitrator nominated within thirty (30) days of appointment.",
		caps: "NOTICE",
	},
} as const;

const GRADIENT_PRESETS: ReadonlyArray<{
	name: string;
	angle: number;
	stops: readonly [string, string];
}> = [
	{ name: "Indigo", angle: 150, stops: ["#6366f1", "#8b5cf6"] },
	{ name: "Sunset", angle: 160, stops: ["#f97316", "#ec4899"] },
	{ name: "Ocean", angle: 160, stops: ["#0ea5e9", "#3b82f6"] },
	{ name: "Forest", angle: 160, stops: ["#16a34a", "#065f46"] },
	{ name: "Ember", angle: 160, stops: ["#ef4444", "#f97316"] },
	{ name: "Midnight", angle: 150, stops: ["#0f172a", "#4f46e5"] },
	{ name: "Sand", angle: 160, stops: ["#fde68a", "#fda4af"] },
	{ name: "Arctic", angle: 160, stops: ["#e0f2fe", "#7dd3fc"] },
];

const DEFAULT_GRADIENT_STOPS = [
	{ id: "1", color: "#6366f1", position: 0 },
	{ id: "2", color: "#f97316", position: 100 },
] satisfies GradientStop[];

/** Parse & normalize a `stops` URL param (same shape as /gradient). */
function parseStopsFromParams(params: URLSearchParams): GradientStop[] | null {
	const raw = params.get("stops");
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length < 2) return null;

		return parsed.map((s: Record<string, unknown>, i: number) => ({
			id: String(i + 1),
			color: typeof s.color === "string" ? s.color : "#6366f1",
			position:
				typeof s.position === "number"
					? Math.max(0, Math.min(100, s.position))
					: 50,
		}));
	} catch {
		return null;
	}
}

function ContrastPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { setContent } = useActionBar();

	const [fgValue, setFgValue] = useState(
		() => searchParams.get("fg")?.toLowerCase() ?? DEFAULT_FG,
	);
	const [bgValue, setBgValue] = useState(
		() => searchParams.get("bg")?.toLowerCase() ?? DEFAULT_BG,
	);
	const [fgModel, setFgModel] = useState<ColorModel>("hex");
	const [bgModel, setBgModel] = useState<ColorModel>("hex");
	const [pickerWhich, setPickerWhich] = useState<
		"fg" | "bg" | "scrim" | null
	>(null);

	const stopsParam = parseStopsFromParams(searchParams);
	const [mode, setMode] = useState<"solid" | "gradient">(() =>
		stopsParam ? "gradient" : searchParams.get("mode") === "gradient" ? "gradient" : "solid",
	);
	const [angle, setAngle] = useState(() => {
		const a = searchParams.get("angle");
		const n = a ? Number(a) : NaN;
		return !Number.isNaN(n) ? Math.max(0, Math.min(360, n)) : 90;
	});
	const [stops, setStops] = useState<GradientStop[]>(
		() => stopsParam ?? DEFAULT_GRADIENT_STOPS,
	);
	const [openPickerId, setOpenPickerId] = useState<string | null>(null);
	const [scrimColor, setScrimColor] = useState("#000000");
	const [scrimTarget, setScrimTarget] = useState<4.5 | 7>(4.5);
	const [controlsOpen, setControlsOpen] = useState(false);
	const [fontChoice, setFontChoice] = useState<FontChoice>("system");
	const [copyChoice, setCopyChoice] = useState<"article" | "ui" | "legal">(
		"article",
	);
	const controlsTriggerRef = useRef<HTMLButtonElement>(null);
	const controlsCloseRef = useRef<HTMLButtonElement>(null);
	const fgPickerRef = useRef<HTMLDivElement>(null);
	const bgPickerRef = useRef<HTMLDivElement>(null);

	// Raw inputs stay free-form so partial values can be typed; consumers
	// handle null when a value is not a valid, complete color.
	const fgHex = useMemo(
		() => (convert(fgValue, fgModel, "hex") ? fgValue.toLowerCase() : null),
		[fgValue, fgModel],
	);
	const bgHex = useMemo(
		() => (convert(bgValue, bgModel, "hex") ? bgValue.toLowerCase() : null),
		[bgValue, bgModel],
	);

	// Display values in the model each input is currently showing.
	const fgDisplay = useMemo(
		() => convert(fgHex ?? "", "hex", fgModel) ?? fgValue,
		[fgHex, fgValue, fgModel],
	);
	const bgDisplay = useMemo(
		() => convert(bgHex ?? "", "hex", bgModel) ?? bgValue,
		[bgHex, bgValue, bgModel],
	);

	const fgOrFallback = fgHex ?? "#000000";
	const filledInk = lightnessOf(fgHex ?? "#ffffff") > 0.65 ? "#0a0a0a" : "#ffffff";

	const sortedStops = useMemo(
		() => [...stops].sort((a, b) => a.position - b.position),
		[stops],
	);

	const analysisStops = useMemo(
		() => stops.map((s) => ({ color: s.color, position: s.position })),
		[stops],
	);

	const gradientCSS = useMemo(() => {
		const parts = sortedStops.map((s) => `${s.color} ${s.position}%`);
		return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
	}, [angle, sortedStops]);

	const gradientAnalysis = useMemo(
		() =>
			mode === "gradient" && fgHex
				? analyzeGradientContrast(fgHex, analysisStops)
				: null,
		[mode, fgHex, analysisStops],
	);

	const ratio = useMemo(() => {
		if (mode === "gradient") return gradientAnalysis?.weakest.ratio ?? null;
		return fgHex && bgHex ? wcagRatio(fgHex, bgHex) : null;
	}, [mode, gradientAnalysis, fgHex, bgHex]);

	const evaluation = useMemo(
		() => (ratio === null ? null : evaluateContrast(ratio)),
		[ratio],
	);

	const bgOrFallback = bgHex ?? "#ffffff";
	/** The background the suggestions must satisfy: the solid bg, or the weakest sampled point. */
	const suggestionBackground =
		mode === "gradient"
			? gradientAnalysis?.weakest.color ?? "#808080"
			: bgHex ?? "#808080";

	const suggestions = useMemo(
		() => {
			if (!fgHex) return { AA: null, AAA: null };

			// Gradient: suggest against EVERY sampled point so the suggestion is
			// safe at every sampled location, not just the previous weakest point.
			if (mode === "gradient" && gradientAnalysis) {
				const backgrounds = gradientAnalysis.samples.map(
					(sample) => sample.color,
				);

				return {
					AA: suggestPassingColorMulti(fgHex, backgrounds, WCAG_THRESHOLDS.aaNormal),
					AAA: suggestPassingColorMulti(fgHex, backgrounds, WCAG_THRESHOLDS.aaaNormal),
				};
			}

			return {
				AA: suggestPassingColor(fgHex, suggestionBackground, WCAG_THRESHOLDS.aaNormal),
				AAA: suggestPassingColor(fgHex, suggestionBackground, WCAG_THRESHOLDS.aaaNormal),
			};
		},
		[fgHex, suggestionBackground, mode, gradientAnalysis],
	);

	const scrim = useMemo(
		() =>
			mode === "gradient" && fgHex
				? solveScrim(fgHex, analysisStops, scrimColor, scrimTarget)
				: null,
		[mode, fgHex, analysisStops, scrimColor, scrimTarget],
	);

	// --- Gradient stop editing (linear only) ---
	/** Stop ids are numeric strings; the next id is always one past the max. */
	const nextStopId = useCallback(
		(existing: readonly GradientStop[]) =>
			String(Math.max(0, ...existing.map((s) => Number(s.id) || 0)) + 1),
		[],
	);

	/** Insert a stop at an arbitrary position, colored to match the gradient there. */
	const addStopAt = useCallback(
		(position: number) => {
			const clamped = Math.max(0, Math.min(100, position));

			// Interpolate neighbors for the new stop's color.
			const before = [...sortedStops].reverse().find((s) => s.position <= clamped);
			const after = sortedStops.find((s) => s.position >= clamped);

			let color: string | null = null;

			if (before && after && before.id !== after.id) {
				const t =
					(clamped - before.position) / Math.max(after.position - before.position, 1e-6);
				color = mixColors(before.color, after.color, t);
			} else {
				color = before?.color ?? after?.color ?? "#6366f1";
			}

			setStops((prev) => [
				...prev,
				{ id: nextStopId(prev), color: color ?? "#6366f1", position: clamped },
			]);
		},
		[nextStopId, sortedStops],
	);

	/** Split the widest gap with a new stop. */
	const addStop = useCallback(() => {
		const positions = [...new Set(sortedStops.map((s) => s.position))].sort(
			(a, b) => a - b,
		);

		let bestStart = 0;
		let widestGap = positions[0] ?? 100;

		for (let i = 0; i < positions.length - 1; i += 1) {
			const gap = positions[i + 1] - positions[i];
			if (gap > widestGap) {
				widestGap = gap;
				bestStart = positions[i];
			}
		}

		const end = positions.find((p) => p > bestStart) ?? 100;
		addStopAt((bestStart + end) / 2);
	}, [addStopAt, sortedStops]);

	const removeStop = useCallback((id: string) => {
		setStops((prev) =>
			prev.length <= 2 ? prev : prev.filter((s) => s.id !== id),
		);
	}, []);

	const updateStopColor = useCallback((id: string, color: string) => {
		setStops((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
	}, []);

	const updateStopPosition = useCallback((id: string, position: number) => {
		setStops((prev) =>
			prev.map((s) =>
				s.id === id ? { ...s, position: Math.max(0, Math.min(100, position)) } : s,
			),
		);
	}, []);

	/** Apply a curated two-stop industry-style gradient preset. */
	const applyGradientPreset = useCallback((preset: (typeof GRADIENT_PRESETS)[number]) => {
		setStops([
			{ id: "1", color: preset.stops[0], position: 0 },
			{ id: "2", color: preset.stops[1], position: 100 },
		]);
		setAngle(preset.angle);
	}, []);

	const scrimCSS = useMemo(() => {
		if (!scrim) return null;

		const r = parseInt(scrimColor.slice(1, 3), 16);
		const g = parseInt(scrimColor.slice(3, 5), 16);
		const b = parseInt(scrimColor.slice(5, 7), 16);

		if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;

		const alpha = scrim.alpha.toFixed(3);
		const parts = sortedStops
			.map((s) => `${s.color} ${s.position}%`)
			.join(", ");

		return `background:\n  linear-gradient(rgba(${r}, ${g}, ${b}, ${alpha}), rgba(${r}, ${g}, ${b}, ${alpha})),\n  linear-gradient(${angle}deg, ${parts});`;
	}, [scrim, scrimColor, sortedStops, angle]);

	useEffect(() => {
		if (!fgHex) return;

		const params = new URLSearchParams();
		params.set("fg", fgHex);

		if (mode === "gradient") {
			params.set("mode", "gradient");
			params.set("angle", String(angle));
			params.set(
				"stops",
				JSON.stringify(
					stops.map((s) => ({ color: s.color, position: s.position })),
				),
			);
		} else if (bgHex) {
			params.set("bg", bgHex);
		}

		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}, [fgHex, bgHex, mode, angle, stops, router, pathname]);

	const handleFgChange = useCallback((value: string) => {
		setFgValue(value);
	}, []);

	const handleBgChange = useCallback((value: string) => {
		setBgValue(value);
	}, []);

	const handleFgModelChange = useCallback((model: ColorModel) => {
		setFgModel(model);
	}, []);

	const handleBgModelChange = useCallback((model: ColorModel) => {
		setBgModel(model);
	}, []);

	const swap = useCallback(() => {
		if (mode === "gradient") {
			setStops((prev) =>
				prev.map((s) => ({ ...s, position: 100 - s.position })),
			);
			return;
		}

		setFgValue(bgValue);
		setBgValue(fgValue);
	}, [fgValue, bgValue, mode]);

	const pickColor = useCallback((which: "fg" | "bg", hex: string) => {
		const lower = hex.toLowerCase();

		if (which === "fg") setFgValue(lower);
		else setBgValue(lower);
	}, []);

	const applySuggestion = useCallback((hex: string) => {
		setFgValue(hex);
	}, []);

	const copyRatio = useCallback(async () => {
		if (ratio === null) return;

		try {
			await navigator.clipboard.writeText(`${ratio.toFixed(2)}:1`);

			sileo.success({
				title: "Ratio copied",
				description: `${fgHex} on ${bgHex} — ${ratio.toFixed(2)}:1`,
			});
		} catch {}
	}, [ratio, fgHex, bgHex]);

	const shareUrl = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			sileo.success({ title: "URL copied" });
		} catch {}
	}, []);

	const downloadContrast = useCallback(async () => {
		try {
			await downloadContrastCard({
				fg: fgHex ?? "#000000",
				bg: bgHex ?? "#ffffff",
				ratio,
				aa: evaluation?.aa ?? { normal: false, large: false },
				aaa: evaluation?.aaa ?? { normal: false, large: false },
				nonTextUI: evaluation?.nonTextUI ?? false,
				suggestionAA: suggestions.AA
					? { color: suggestions.AA.color, ratio: suggestions.AA.ratio }
					: null,
				suggestionAAA: suggestions.AAA
					? { color: suggestions.AAA.color, ratio: suggestions.AAA.ratio }
					: null,
				mode,
				gradientStops: mode === "gradient" ? analysisStops : undefined,
				gradientAngle: angle,
			});
			sileo.success({ title: "Contrast image downloaded" });
		} catch {
			sileo.error({ title: "Download failed" });
		}
	}, [fgHex, bgHex, ratio, evaluation, suggestions, mode, analysisStops, angle]);

	useEffect(() => {
		if (!controlsOpen) return;

		// Escape dismisses the mobile controls drawer; focus is restored on close.
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setControlsOpen(false);
		};

		document.addEventListener("keydown", onKeyDown);
		controlsCloseRef.current?.focus();

		const trigger = controlsTriggerRef.current;

		return () => {
			document.removeEventListener("keydown", onKeyDown);
			trigger?.focus();
		};
	}, [controlsOpen]);

	useEffect(() => {
		if (pickerWhich === null) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setPickerWhich(null);
		};

		document.addEventListener("keydown", onKeyDown);

		return () => document.removeEventListener("keydown", onKeyDown);
	}, [pickerWhich]);

	useEffect(() => {
		const content = (
			<div className="flex items-center gap-3">
				{mode === "solid" && (
					<Button
						variant="bare"
						size="sm"
						onClick={swap}
						className="text-background/60 hover:text-muted"
						aria-label="Swap foreground and background"
					>
						<ArrowsLeftRightIcon size={14} />
						<span className="hidden md:inline">Swap</span>
					</Button>
				)}
				<Button
					variant="bare"
					size="sm"
					onClick={copyRatio}
					className="text-background/60 hover:text-muted"
					aria-label="Copy contrast ratio"
					disabled={ratio === null}
				>
					<CopySimpleIcon size={14} />
					<span className="hidden md:inline">Copy ratio</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={shareUrl}
					className="text-background/60 hover:text-muted"
					aria-label="Copy share URL"
				>
					<LinkSimpleIcon size={14} />
					<span className="hidden md:inline">Share</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={downloadContrast}
					className="text-background/60 hover:text-muted"
					aria-label="Save contrast result as image"
				>
					<DownloadSimpleIcon size={14} />
					<span className="hidden md:inline">Image</span>
				</Button>
			</div>
		);
		setContent(content);
		return () => setContent(null);
	}, [mode, swap, copyRatio, shareUrl, setContent, ratio, downloadContrast]);

	const resultRows = [
		{ id: "aa-normal", label: "AA", detail: "Normal text", ratio: WCAG_THRESHOLDS.aaNormal, pass: evaluation?.aa.normal },
		{ id: "aa-large", label: "AA", detail: "Large text", ratio: WCAG_THRESHOLDS.aaLarge, pass: evaluation?.aa.large },
		{ id: "aaa-normal", label: "AAA", detail: "Normal text", ratio: WCAG_THRESHOLDS.aaaNormal, pass: evaluation?.aaa.normal },
		{ id: "aaa-large", label: "AAA", detail: "Large text", ratio: WCAG_THRESHOLDS.aaaLarge, pass: evaluation?.aaa.large },
		{ id: "ui", label: "UI", detail: "Non-text UI", ratio: WCAG_THRESHOLDS.nonTextUI, pass: evaluation?.nonTextUI },
	] as const;

	const [activeRow, setActiveRow] = useState<string | null>(null);
	const toggleRow = useCallback(
		(id: string) => setActiveRow((cur) => (cur === id ? null : id)),
		[],
	);

	useEffect(() => {
		if (!activeRow) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setActiveRow(null);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [activeRow]);

	const activeRowPass = activeRow
		? resultRows.find((row) => row.id === activeRow)?.pass
		: undefined;

	const previewRowClass = (rowIds: readonly string[]) =>
		activeRow && rowIds.includes(activeRow)
			? activeRowPass
				? "ws-hl-pass"
				: "ws-hl-fail"
			: "";

	return (
		<section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16">
			<header className="flex flex-wrap items-end justify-between gap-4 pb-8">
				<div>
					<h1 className="font-mono text-2xl tracking-tight">contrast checker</h1>
					<p className="max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground/60">
						WCAG 2.2 contrast for your foreground and its background. Solid is the default; gradient mode retests every criterion at the weakest point along the axis.
					</p>
				</div>
				<SegmentedControl
					label="Background mode"
					value={mode}
					onValueChange={setMode}
					options={[
						{ value: "solid", label: "Solid" },
						{ value: "gradient", label: "Gradient" },
					]}
				/>
			</header>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
				{/* Preview + readout */}
				<div className="flex min-w-0 flex-col gap-4">
					<div className="flex flex-wrap items-end justify-between gap-6 border border-border/60 bg-muted/10 px-6 py-5">
						<div>
							<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								Contrast ratio
							</p>
							<p
								className="mt-1 font-mono leading-none text-foreground tabular-nums"
								aria-live="polite"
							>
								<span className="text-6xl">{ratio === null ? "--" : ratio.toFixed(2)}</span>
								<span className="ml-1 text-2xl text-muted-foreground/60">: 1</span>
							</p>
						</div>
						{evaluation && (
							<div className="flex items-center gap-2 border border-border/60 px-3 py-1.5 font-mono text-xs text-muted-foreground">
								{evaluation.aaa.normal ? (
									<>
										<CheckIcon size={14} aria-hidden /> AAA
									</>
								) : evaluation.aa.normal ? (
									<>
										<CheckIcon size={14} aria-hidden /> AA
									</>
								) : (
									<>
										<XCircleIcon size={14} aria-hidden /> fails
									</>
								)}
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<div className="flex items-center gap-2">
							<span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								Typeface
							</span>
							<SegmentedControl
								label="Preview typeface"
								value={fontChoice}
								onValueChange={setFontChoice}
								options={[
									{ value: "system", label: "Sans" },
									{ value: "serif", label: "Serif" },
									{ value: "arial", label: "Arial" },
									{ value: "trebuchet", label: "Treb." },
									{ value: "mono", label: "Mono" },
								]}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								Copy
							</span>
							<SegmentedControl
								label="Preview copy pack"
								value={copyChoice}
								onValueChange={(value) => setCopyChoice(value as typeof copyChoice)}
								options={[
									{ value: "article", label: "Article" },
									{ value: "ui", label: "UI" },
									{ value: "legal", label: "Legal" },
								]}
							/>
						</div>
					</div>
					<p className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/50">
						Typeface and copy pack don&rsquo;t change the ratio. WCAG reads luminance, not letterforms.
					</p>
					{/* Realistic text preview */}
					<div
						className="border border-border/60 p-8"
						style={
							{
								...(mode === "gradient"
									? { background: gradientCSS }
									: { background: bgOrFallback }),
								color: fgOrFallback,
								fontFamily: TYPEFACE_STACK[fontChoice],
							} as React.CSSProperties
						}
					>
						<p className="font-mono text-[10px] uppercase tracking-wider opacity-60">
							{COPY_PACKS[copyChoice].caps}
						</p>
						<h2
							className={`mt-2 max-w-md text-3xl leading-tight outline-none transition-shadow duration-150 ${previewRowClass(["aa-large", "aaa-large"])}`}
						>
							{COPY_PACKS[copyChoice].heading}
						</h2>
						<p
							className={`mt-3 max-w-md font-mono text-[10px] uppercase tracking-wider opacity-50 outline-none transition-shadow duration-150 ${previewRowClass(["aa-normal", "aaa-normal"])}`}
						>
							{COPY_PACKS[copyChoice].decor}
						</p>

						<p
							className={`mt-4 max-w-prose text-base leading-relaxed outline-none transition-shadow duration-150 ${previewRowClass(["aa-normal", "aaa-normal"])}`}
						>
							{COPY_PACKS[copyChoice].body}
						</p>
						<p
							className={`mt-6 max-w-md text-2xl leading-snug outline-none transition-shadow duration-150 ${previewRowClass(["aa-large", "aaa-large"])}`}
						>
							Large text at 1.5rem — judged against the 3:1 threshold.
						</p>
						<p
							className={`mt-4 max-w-md text-base leading-relaxed opacity-70 outline-none transition-shadow duration-150 ${previewRowClass(["aa-normal", "aaa-normal"])}`}
						>
							Secondary paragraph at reduced opacity, for low-emphasis copy.
						</p>
						<div className="mt-6 flex flex-wrap items-center gap-3">
							<button
								type="button"
								className={`cursor-pointer border bg-transparent px-4 py-2 text-sm transition-transform active:scale-[0.97] outline-none transition-shadow duration-150 ${previewRowClass(["ui"])}`}
								style={{ borderColor: fgOrFallback, color: fgOrFallback }}
								aria-label="Example outlined button"
							>
								Outlined button
							</button>
							<button
								type="button"
								className={`cursor-pointer px-4 py-2 text-sm transition-transform active:scale-[0.97] outline-none transition-shadow duration-150 ${previewRowClass(["ui"])}`}
								style={{ background: fgOrFallback, color: filledInk }}
								aria-label="Example filled button"
							>
								Filled button
							</button>
						</div>
					</div>

					{mode === "gradient" && (
						<div className="border border-border/60 bg-muted/10 p-4">
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
									Heat strip · pass ≥ 4.5:1
								</p>
								{gradientAnalysis && (
									<p className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
										weakest {Math.round(
											gradientAnalysis.weakest.position * 100,
										)}
										% · {gradientAnalysis.weakest.color} ·{" "}
										{gradientAnalysis.weakest.ratio.toFixed(2)}:1
									</p>
								)}
							</div>
							<div
								className="mt-2 flex h-4 w-full overflow-hidden border border-border/60"
								role="img"
								aria-label="Contrast heat strip across the gradient axis"
							>
								{gradientAnalysis?.samples.map((sample, i) => (
									<div
										key={i}
										className="h-full flex-1"
										title={`${Math.round(
											sample.position * 100,
										)}% · ${sample.ratio.toFixed(2)}:1`}
										style={{
											background:
												mixColors(
													sample.color,
													sample.ratio >= WCAG_THRESHOLDS.aaNormal
														? "#22c55e"
														: "#ef4444",
													0.35,
												) ?? sample.color,
										}}
									/>
								))}
							</div>
							{gradientAnalysis && (
								<p className="mt-2 font-mono text-[9px] leading-relaxed text-muted-foreground/50">
									{gradientAnalysis.strategy}. {gradientAnalysis.limitations}.
								</p>
							)}
						</div>
					)}
				</div>

				{/* Controls + results */}
			{/* Mobile trigger — opens the controls drawer on the right */}
			<button
				ref={controlsTriggerRef}
				type="button"
				onClick={() => setControlsOpen((v) => !v)}
				className="fixed bottom-20 right-4 z-30 flex size-12 cursor-pointer items-center justify-center border border-border bg-background text-foreground shadow-lg transition-transform active:scale-[0.96] lg:hidden"
				aria-label="Toggle contrast controls"
				aria-expanded={controlsOpen}
			>
				<SlidersHorizontalIcon size={18} aria-hidden />
			</button>

			{controlsOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/20 lg:hidden"
					onPointerDown={() => setControlsOpen(false)}
					aria-hidden
				/>
			)}

			{/* Controls + results */}
			<aside
				aria-label="Contrast controls"
				className={[
					"fixed inset-y-0 right-0 z-40 flex h-full w-[82vw] max-w-[380px] flex-col gap-6 overflow-y-auto border-l border-border/60 bg-background p-5 pb-24 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
					controlsOpen ? "translate-x-0" : "translate-x-full",
					"lg:static lg:z-auto lg:h-auto lg:w-full lg:min-w-0 lg:min-h-0 lg:flex-none lg:translate-x-0 lg:overflow-visible lg:border lg:border-border/60 lg:bg-muted/10 lg:p-5 lg:pb-5 lg:shadow-none lg:transition-none",
				].join(" ")}
			>
				<button
					ref={controlsCloseRef}
					type="button"
					onClick={() => setControlsOpen(false)}
					className="ml-auto flex size-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground lg:hidden"
					aria-label="Close contrast controls"
				>
					<XIcon size={18} aria-hidden />
				</button>
					<div>
						<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
							Foreground
						</p>
						<div className="mt-2 flex items-center gap-2">
							<div className="relative flex shrink-0 items-center">
								<button
									type="button"
									onClick={() => setPickerWhich(pickerWhich === "fg" ? null : "fg")}
									className="cursor-pointer"
									aria-label="Pick a foreground color"
								>
									<ColorSwatch color={fgOrFallback} size="sm" className="rounded-md border border-border/70 p-0.5" />
								</button>
								{pickerWhich === "fg" && (
									<>
										<div className="fixed inset-0 z-40" onPointerDown={() => setPickerWhich(null)} />
										<div ref={fgPickerRef} className="absolute top-full left-0 z-50 mt-2 border border-border rounded-xl bg-background p-1.5 shadow-lg">
											<HexAlphaColorPicker color={fgOrFallback} onChange={(value) => pickColor("fg", value)} className="rounded-lg" />
										</div>
									</>
								)}
							</div>
							<div className="min-w-0 flex-1">
								<ColorInput
									value={fgDisplay}
									model={fgModel}
									onValueChange={handleFgChange}
									onModelChange={handleFgModelChange}
									inputAriaLabel="Foreground color value"
								/>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-center">
						<button
							type="button"
							onClick={swap}
							className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:text-foreground active:scale-[0.96]"
							aria-label={
								mode === "gradient"
									? "Flip gradient direction"
									: "Swap foreground and background"
							}
						>
							{mode === "gradient" ? (
								<ArrowsLeftRightIcon size={14} aria-hidden />
							) : (
								<SwapIcon size={14} aria-hidden />
							)}
						</button>
					</div>

					{mode === "solid" ? (
						<div>
							<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								Background
							</p>
							<div className="mt-2 flex items-center gap-2">
								<div className="relative flex shrink-0 items-center">
									<button
										type="button"
										onClick={() =>
											setPickerWhich(pickerWhich === "bg" ? null : "bg")
										}
										className="cursor-pointer"
										aria-label="Pick a background color"
									>
										<ColorSwatch color={bgOrFallback} size="sm" className="rounded-md border border-border/70 p-0.5" />
									</button>
									{pickerWhich === "bg" && (
										<>
											<div className="fixed inset-0 z-40" onPointerDown={() => setPickerWhich(null)} />
											<div ref={bgPickerRef} className="absolute top-full left-0 z-50 mt-2 border border-border rounded-xl bg-background p-1.5 shadow-lg">
												<HexAlphaColorPicker color={bgOrFallback} onChange={(value) => pickColor("bg", value)} className="rounded-lg" />
											</div>
										</>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<ColorInput
										value={bgDisplay}
										model={bgModel}
										onValueChange={handleBgChange}
										onModelChange={handleBgModelChange}
										inputAriaLabel="Background color value"
									/>
								</div>
							</div>
						</div>
					) : (
						<div>
							<div className="flex items-center justify-between">
								<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
									Gradient stops
								</p>
								<button
									type="button"
									onClick={addStop}
									className="flex h-7 cursor-pointer items-center gap-1 px-1.5 font-mono text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
									aria-label="Add gradient stop"
								>
									<PlusCircleIcon size={14} aria-hidden />
									Add
								</button>
							</div>

							<div className="mt-3 flex items-center justify-between">
								<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
									Presets
								</p>
							</div>
							<div className="mt-1.5 flex flex-wrap gap-1.5">
								{GRADIENT_PRESETS.map((preset) => (
									<button
										key={preset.name}
										type="button"
										onClick={() => applyGradientPreset(preset)}
										className="group flex h-8 cursor-pointer items-center overflow-hidden border border-border/60 bg-muted/20 transition-colors hover:border-foreground/40"
										aria-label={`Apply ${preset.name} gradient preset`}
									>
										<span
											className="h-full w-9 shrink-0"
											style={{
												background: `linear-gradient(120deg, ${preset.stops[0]}, ${preset.stops[1]})`,
											}}
											aria-hidden
										/>
										<span className="pr-2 pl-1.5 font-mono text-[10px] text-muted-foreground transition-colors group-hover:text-foreground">
											{preset.name}
										</span>
									</button>
								))}
							</div>
							<p className="mt-1.5 font-mono text-[9px] leading-relaxed text-muted-foreground/50">
								Common industry styles, spelled out explicitly — no brand marks attached.
							</p>

							<div className="mt-3 flex items-center justify-between gap-3">
								<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
									Angle
								</span>
								<ScrubInput
									value={angle}
									min={0}
									max={360}
									step={5}
									fineStep={1}
									unitsPerPixel={1.8}
									fineUnitsPerPixel={0.18}
									onValueChange={(value) => setAngle(Math.round(value))}
									ariaLabel="Gradient angle"
									suffix="°"
									icon={<CompassIcon size={12} aria-hidden />}
									className="w-44"
								/>
							</div>

							<div className="mt-2">
								<GradientBar
									stops={sortedStops}
									gradientCSS={gradientCSS}
									onPositionChange={updateStopPosition}
									onAddStop={addStopAt}
								/>
							</div>

							<div className="mt-2 flex flex-col gap-1.5">
								{sortedStops.map((stop, i) => (
									<StopRow
										key={stop.id}
										stop={stop}
										index={i}
										colorModel="hex"
										isPickerOpen={openPickerId === stop.id}
										onTogglePicker={() =>
											setOpenPickerId(openPickerId === stop.id ? null : stop.id)
										}
										onClosePicker={() => setOpenPickerId(null)}
										onColorChange={(color) => updateStopColor(stop.id, color)}
										onPositionChange={(position) =>
											updateStopPosition(stop.id, position)
										}
										onRemove={() => removeStop(stop.id)}
										canRemove={stops.length > 2}
									/>
								))}
							</div>
						</div>
					)}

					<div className="border-t border-border/60 pt-4">
						<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
							WCAG 2.2 evaluation
						</p>
						<ul className="mt-2 flex flex-col gap-1.5">
							{resultRows.map((row) => {
								const pass = row.pass;
								const active = activeRow === row.id;
								const tone =
									pass === true
										? "text-emerald-700 dark:text-emerald-400"
										: pass === false
											? "text-red-700 dark:text-red-400"
											: "text-muted-foreground/60";

								const chipTone =
									pass === true
										? "border-emerald-600/30 bg-emerald-500/10"
										: pass === false
											? "border-red-600/30 bg-red-500/10"
											: "border-border/60";

								const icon =
									pass === true ? (
										<CheckCircleIcon size={13} aria-hidden />
									) : pass === false ? (
										<XCircleIcon size={13} aria-hidden />
									) : null;

			const activeTone =
				active
					? pass === true
						? "border-emerald-600/40 bg-emerald-500/10"
						: pass === false
							? "border-red-600/40 bg-red-500/10"
							: "border-foreground/40 bg-foreground/5"
					: "";

								return (
									<li key={row.id}>
										<button
											type="button"
											onClick={() => toggleRow(row.id)}
											aria-pressed={active}
											aria-label={`${row.label} ${row.detail}: ${pass === true ? "pass" : pass === false ? "fail" : "pending"}. Click to highlight preview.`}
											className={`flex w-full cursor-pointer items-center justify-between gap-3 border px-2 py-2 text-left transition-colors outline-none ${
												active && activeTone
													? activeTone
													: "border-border/50 hover:border-foreground/30 hover:bg-muted/20"
											}`}
										>
											<span className="min-w-0">
												<span className={`block font-mono text-xs ${tone}`}>
													{row.label} · {row.detail}
												</span>
												<span className="block font-mono text-[10px] text-muted-foreground/60">
													≥ {row.ratio}:1
												</span>
											</span>
											<span
												className={`flex shrink-0 items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${chipTone} ${tone}`}
											>
												{icon}
												{pass === true ? "Pass" : pass === false ? "Fail" : "—"}
											</span>
										</button>
									</li>
								);
							})}
						</ul>
						<p className="mt-2 font-mono text-[9px] leading-relaxed text-muted-foreground/50">
							Normal text: under 24px, or under 18.66px at bold. Non-text covers UI components and graphics. Not the same bar as AA Large.
						</p>
					</div>

					{mode === "gradient" && (
						<div className="border-t border-border/60 pt-4">
							<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								Scrim — minimum overlay opacity to reach target
							</p>
							<div className="mt-2 flex items-center gap-2">
								<div className="relative flex shrink-0 items-center">
									<button
										type="button"
										onClick={() =>
											setPickerWhich(pickerWhich === "scrim" ? null : "scrim")
										}
										className="cursor-pointer"
										aria-label="Pick a scrim color"
									>
										<ColorSwatch color={scrimColor} size="sm" className="rounded-md border border-border/70 p-0.5" />
									</button>
									{pickerWhich === "scrim" && (
										<>
											<div className="fixed inset-0 z-40" onPointerDown={() => setPickerWhich(null)} />
											<div className="absolute bottom-full left-0 z-50 mb-2 border border-border rounded-xl bg-background p-1.5 shadow-lg">
												<HexAlphaColorPicker color={scrimColor} onChange={(value) => setScrimColor(value.toLowerCase())} className="rounded-lg" />
											</div>
										</>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<input
										type="text"
										value={scrimColor}
										onChange={(e) => setScrimColor(e.target.value.toLowerCase())}
										className="h-8 w-full min-w-0 border border-border/70 bg-muted/20 px-2 font-mono text-[11px] text-foreground outline-none transition-colors focus:border-ring"
										spellCheck={false}
										autoComplete="off"
										aria-label="Scrim color value"
									/>
								</div>
								<SegmentedControl
									label="Scrim target"
									value={String(scrimTarget)}
									onValueChange={(value) => setScrimTarget(Number(value) as 4.5 | 7)}
									options={[
										{ value: "4.5", label: "AA" },
										{ value: "7", label: "AAA" },
									]}
								/>
							</div>
							{scrim ? (
								<div className="mt-2 border border-border/40 bg-muted/20 p-2.5 font-mono text-[11px] leading-relaxed">
									<div className="flex items-baseline justify-between gap-3">
										<span className="text-muted-foreground/70">worst point</span>
										<span className="tabular-nums text-muted-foreground/50">
											{scrim.ratioBefore.toFixed(2)}:1 → {scrim.ratioAfter.toFixed(2)}:1
										</span>
									</div>
									<p className="mt-1.5 text-foreground">
										{(scrim.alpha * 100).toFixed(1)}% overlay reaches {scrimTarget}:1
									</p>
									<p className="mt-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/50">
										verify: re-measured, not extrapolated
									</p>
									{scrimCSS && (
										<button
											type="button"
											onClick={() => {
												void navigator.clipboard?.writeText(scrimCSS);
												sileo.success({ title: "Scrim CSS copied" });
											}}
											className="mt-2 flex h-7 cursor-pointer items-center gap-1.5 border border-border px-2.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
											aria-label="Copy scrim CSS snippet"
										>
											<CopySimpleIcon size={12} aria-hidden />
											Copy scrim CSS
										</button>
									)}
								</div>
							) : (
								<p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground/70">
									{fgHex
										? `No opacity of ${scrimColor} can reach ${scrimTarget}:1 at the worst sampled point.`
										: "Set a foreground color to solve for a scrim."}
								</p>
							)}
						</div>
					)}

					<div className="border-t border-border/60 pt-4">
						<p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
							Suggestion (foreground)
						</p>
						<ul className="mt-2 flex flex-col gap-2">
							{(["AA", "AAA"] as const).map((level) => {
								const suggestion = suggestions[level];
								const target =
									level === "AA" ? WCAG_THRESHOLDS.aaNormal : WCAG_THRESHOLDS.aaaNormal;

								return (
									<li
										key={level}
										className="flex items-center gap-3 border border-border/40 p-2"
									>
										<span
											className="size-8 shrink-0 border border-border/60"
											style={{ background: suggestion?.color ?? "transparent" }}
											aria-hidden
										/>
										<div className="min-w-0 flex-1">
											<p className="font-mono text-[11px] text-foreground">
												{suggestion ? `${level} ≥ ${target}` : `${level} unreachable`}
											</p>
											<p className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground/60">
												{suggestion
													? `${suggestion.color} · ${suggestion.ratio.toFixed(2)}:1`
													: `no color on this background reaches ${target}:1`}
											</p>
										</div>
										<button
											type="button"
											onClick={() => suggestion && applySuggestion(suggestion.color)}
											disabled={!suggestion}
											className="h-7 shrink-0 cursor-pointer border border-border px-2.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-30"
											aria-label={
												suggestion
													? `Apply ${level} suggestion`
													: `${level} unreachable`
											}
										>
											Apply
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				</aside>
			</div>
		</section>
	);
}

export default function ContrastPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-full items-center justify-center font-mono text-sm text-muted-foreground">
					Loading...
				</div>
			}
		>
			<ContrastPageContent />
		</Suspense>
	);
}
