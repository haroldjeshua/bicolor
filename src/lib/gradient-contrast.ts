import {
	converter,
	parse,
	formatHex,
	clampChroma,
	type Color,
} from "culori";
import { wcagRatio } from "./contrast";

const toRgb = converter("rgb");
const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export interface GradientStopInput {
	/** Any culori-parseable color; alpha is ignored and treated as opaque. */
	readonly color: string;
	/** 0–100. */
	readonly position: number;
}

export interface GradientSample {
	/** Contrast ratio (1–21) at this point. */
	readonly ratio: number;
	/** Normalized position along the gradient axis, 0–1. */
	readonly position: number;
	/** Local gradient color at this point, hex-serialized. */
	readonly color: string;
}

export interface GradientContrastReport {
	/** Weakest sampled contrast — the driver of pass/fail in gradient mode. */
	readonly weakest: GradientSample;
	/** Coarse samples for the heat strip. */
	readonly samples: readonly GradientSample[];
	/** Total samples evaluated, including adaptive refinement. */
	readonly probes: number;
	/** Human-readable strategy description. */
	readonly strategy: string;
	/** Human-readable limitations. */
	readonly limitations: string;
}

interface ParsedStop {
	/** Normalized to [0, 1]. */
	readonly position: number;
	/** sRGB channels in [0, 1]. */
	readonly r: number;
	readonly g: number;
	readonly b: number;
}

const rgbChannel = (value: number | undefined) =>
	typeof value === "number" ? clamp01(value) : 0;

const serializeRgb = (c: { r: number; g: number; b: number }) => {
	const hex = (v: number) =>
		Math.round(clamp01(v) * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`;
};

/** Normalize unordered stops into sRGB-space samples, deduping equal positions (last wins, like CSS). */
function parseStops(
	stops: readonly GradientStopInput[],
): readonly ParsedStop[] | null {
	if (stops.length < 2) return null;

	const parsed: { stop: ParsedStop; originalIndex: number }[] = [];

	for (const [index, stop] of stops.entries()) {
		if (
			typeof stop.position !== "number" ||
			Number.isNaN(stop.position) ||
			stop.position < 0 ||
			stop.position > 100
		) {
			return null;
		}

		const color = parse(stop.color);
		if (!color) return null;

		const rgb = toRgb(clampChroma(color, "oklch"));
		if (!rgb) return null;

		parsed.push({
			stop: {
				position: stop.position / 100,
				r: rgbChannel(rgb.r),
				g: rgbChannel(rgb.g),
				b: rgbChannel(rgb.b),
			},
			originalIndex: index,
		});
	}

	parsed.sort(
		(a, b) =>
			a.stop.position !== b.stop.position
				? a.stop.position - b.stop.position
				: a.originalIndex - b.originalIndex,
	);

	// Coalesce duplicate positions (CSS semantics: the later stop wins).
	const deduped: ParsedStop[] = [];

	for (const { stop } of parsed) {
		const last = deduped[deduped.length - 1];

		if (last && Math.abs(last.position - stop.position) < 1e-9) {
			deduped[deduped.length - 1] = stop;
		} else {
			deduped.push(stop);
		}
	}

	return deduped;
}

/** CSS legacy stops interpolate linearly in sRGB; we sample analytically. */
function sampleStopsAt(
	stops: readonly ParsedStop[],
	t: number,
): { r: number; g: number; b: number } {
	const clamped = clamp01(t);

	if (clamped <= stops[0].position) return stops[0];
	if (clamped >= stops[stops.length - 1].position) {
		return stops[stops.length - 1];
	}

	for (let i = 0; i < stops.length - 1; i += 1) {
		const a = stops[i];
		const b = stops[i + 1];

		if (clamped >= a.position && clamped <= b.position) {
			const span = b.position - a.position;
			const f = span === 0 ? 0 : (clamped - a.position) / span;

			return {
				r: a.r + (b.r - a.r) * f,
				g: a.g + (b.g - a.g) * f,
				b: a.b + (b.b - a.b) * f,
			};
		}
	}

	return stops[stops.length - 1];
}

const toHex = (color: Color) =>
	formatHex(clampChroma(color, "oklch"))?.toLowerCase() ?? null;

function contrastAt(
	fgHex: string,
	stops: readonly ParsedStop[],
	t: number,
): GradientSample {
	const local = sampleStopsAt(stops, t);
	const hex = serializeRgb(local);
	const ratio = wcagRatio(fgHex, hex) ?? 1;

	return { ratio, position: t, color: hex };
}

const COARSE_SAMPLES = 33;

/**
 * Sample 33 uniform probes, then refine the 1/32-wide intervals adjacent to
 * the weakest probe with 31 subdivisions each (bounded).
 *
 * Honest limitations: this reports the weakest SAMPLED point, not a proven
 * global minimum — the luminance curve may wiggle between probes. No second
 * derivative is checked; refinement is local to the coarse phase.
 */
export function analyzeGradientContrast(
	foreground: string,
	stops: readonly GradientStopInput[],
): GradientContrastReport | null {
	const fg = parse(foreground);
	if (!fg) return null;

	const normalized = parseStops(stops);
	if (!normalized) return null;

	const fgHex = toHex(fg);
	if (!fgHex) return null;

	const coarse: GradientSample[] = [];

	for (let i = 0; i < COARSE_SAMPLES; i += 1) {
		coarse.push(contrastAt(fgHex, normalized, i / (COARSE_SAMPLES - 1)));
	}

	let probes = COARSE_SAMPLES;
	let weakest = coarse.reduce((min, s) =>
		s.ratio < min.ratio ? s : min,
	);

	// Refine 1/32-wide intervals adjacent to the coarse weakest point.
	const worstIndex = coarse.findIndex((s) => s === weakest);
	const intervalIndices: [number, number][] = [
		[Math.max(0, worstIndex - 1), worstIndex],
		[worstIndex, Math.min(COARSE_SAMPLES - 1, worstIndex + 1)],
	];

	for (const [a, b] of intervalIndices) {
		if (a === b) continue;

		const intervalStart = coarse[a].position;
		const intervalEnd = coarse[b].position;

		for (let i = 1; i < 32; i += 1) {
			const t = intervalStart + ((intervalEnd - intervalStart) * i) / 32;
			const refined = contrastAt(fgHex, normalized, t);
			probes += 1;

			if (refined.ratio < weakest.ratio) weakest = refined;
		}
	}

	return {
		weakest,
		samples: coarse,
		probes,
		strategy:
			"sRGB interpolation (matches CSS legacy-stop rendering), 33 uniform probes plus 31 refined probes in each 1/32-wide interval adjacent to the weakest point",
		limitations:
			"Reports the weakest sampled point, not a proven global minimum; the luminance curve is not second-order analyzed and refinement is local to the coarse phase",
	};
}

export interface ScrimResult {
	/** Minimum overlay opacity in [0, 1] achieving the target at the weakest sampled point. */
	readonly alpha: number;
	/** Re-measured worst-sampled contrast after applying the scrim. */
	readonly ratioAfter: number;
	/** Worst-sampled contrast before the scrim. */
	readonly ratioBefore: number;
}

/**
 * Solve for the minimum opacity of `overlay` needed to bring the weakest
 * sampled point of the gradient to `target`.
 *
 * Composed in sRGB with the overlay over every stop; sRGB composition is
 * affine, so sampling the composed stops equals sampling the composed gradient.
 * Returns null when even a full overlay cannot reach the target.
 */
export function solveScrim(
	foreground: string,
	stops: readonly GradientStopInput[],
	overlay: string,
	target: number,
): ScrimResult | null {
	const fg = parse(foreground);
	const ov = parse(overlay);
	if (!fg || !ov) return null;

	const ovRgb = toRgb(ov);
	if (!ovRgb) return null;

	const fgHex = toHex(fg);
	if (!fgHex) return null;

	const ovR = rgbChannel(ovRgb.r);
	const ovG = rgbChannel(ovRgb.g);
	const ovB = rgbChannel(ovRgb.b);

	const composedStops = (alpha: number): GradientStopInput[] => {
		const mixChannel = (c: number, o: number) => c * (1 - alpha) + o * alpha;

		return stops.map((stop) => {
			const parsed = parse(stop.color);
			if (!parsed) return stop;

			const rgb = toRgb(clampChroma(parsed, "oklch"));
			if (!rgb) return stop;

			return {
				color: serializeRgb({
					r: mixChannel(rgbChannel(rgb.r), ovR),
					g: mixChannel(rgbChannel(rgb.g), ovG),
					b: mixChannel(rgbChannel(rgb.b), ovB),
				}),
				position: stop.position,
			};
		});
	};

	const before = analyzeGradientContrast(fgHex, stops);
	if (!before) return null;

	// Even a fully opaque overlay can't reach the target — honest null.
	const atFull = analyzeGradientContrast(fgHex, composedStops(1));
	if (!atFull || atFull.weakest.ratio < target) return null;

	let low = 0;
	let high = 1;

	for (let i = 0; i < 32; i += 1) {
		const mid = (low + high) / 2;
		const probe = analyzeGradientContrast(fgHex, composedStops(mid));

		if (probe && probe.weakest.ratio >= target) high = mid;
		else low = mid;
	}

	const after = analyzeGradientContrast(fgHex, composedStops(high));
	if (!after) return null;

	return { alpha: high, ratioBefore: before.weakest.ratio, ratioAfter: after.weakest.ratio };
}
