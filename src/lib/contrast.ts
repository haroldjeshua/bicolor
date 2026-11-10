import {
	clampChroma,
	converter,
	formatHex,
	parse,
	wcagContrast,
	type Color,
} from "culori";

/** WCAG 2.2 thresholds, in contrast-ratio units. */
export const WCAG_THRESHOLDS = {
	aaNormal: 4.5,
	aaLarge: 3,
	aaaNormal: 7,
	aaaLarge: 4.5,
	nonTextUI: 3,
} as const;

const toOklch = converter("oklch");

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * WCAG contrast ratio (1–21) between two opaque colors.
 * Returns null for unparseable input. Alpha is ignored — WCAG luminance
 * only makes sense for opaque colors.
 */
export function wcagRatio(
	foreground: string,
	background: string,
): number | null {
	const fg = parse(foreground);
	const bg = parse(background);

	if (!fg || !bg) return null;

	const ratio = wcagContrast(fg, bg);
	return Number.isFinite(ratio) ? ratio : null;
}

export interface ContrastEvaluation {
	/** Contrast ratio used for the evaluation, 1–21. */
	readonly ratio: number;
	readonly aa: { normal: boolean; large: boolean };
	readonly aaa: { normal: boolean; large: boolean };
	readonly nonTextUI: boolean;
}

/** Classify a contrast ratio against WCAG 2.2 AA/AAA for text sizes and UI components. */
export function evaluateContrast(ratio: number): ContrastEvaluation {
	return {
		ratio,
		aa: {
			normal: ratio >= WCAG_THRESHOLDS.aaNormal,
			large: ratio >= WCAG_THRESHOLDS.aaLarge,
		},
		aaa: {
			normal: ratio >= WCAG_THRESHOLDS.aaaNormal,
			large: ratio >= WCAG_THRESHOLDS.aaaLarge,
		},
		nonTextUI: ratio >= WCAG_THRESHOLDS.nonTextUI,
	};
}

export interface Suggestion {
	/** Suggested color, serialized as hex. */
	readonly color: string;
	/** Its verified contrast ratio against the background (always >= target). */
	readonly ratio: number;
}

/**
 * Suggest a foreground that meets `target` against EVERY background in the
 * list (e.g. the sampled colors of a gradient). The reported ratio is the
 * worst measured across the set, so a suggestion is safe at every sampled
 * point — never extrapolated.
 */
export function suggestPassingColorMulti(
	foreground: string,
	backgrounds: readonly string[],
	target: number,
): Suggestion | null {
	const fg = parse(foreground);
	if (!fg) return null;

	const parsedBackgrounds: Color[] = [];

	for (const background of backgrounds) {
		const parsed = parse(background);
		if (parsed) parsedBackgrounds.push(parsed);
	}

	if (parsedBackgrounds.length === 0) return null;

	const oklch = toOklch(fg);
	if (!oklch) return null;

	const startL = clamp01(typeof oklch.l === "number" ? oklch.l : 0.5);
	const startC = typeof oklch.c === "number" ? oklch.c : 0;
	const startH = typeof oklch.h === "number" ? oklch.h : 0;

	const atLightness = (l: number) => {
		const candidate = clampChroma(
			{ mode: "oklch", l, c: startC, h: startH },
			"oklch",
		);

		let worst = Infinity;
		for (const bg of parsedBackgrounds) {
			const ratio = wcagContrast(candidate, bg);
			if (ratio < worst) worst = ratio;
		}

		return { candidate, worst };
	};

	// Already passing everywhere — the nearest suggestion is itself.
	if (atLightness(startL).worst >= target) {
		const self = clampChroma(
			{ mode: "oklch", l: startL, c: startC, h: startH },
			"oklch",
		);
		const hex = formatHex(self)?.toLowerCase();

		if (!hex) return null;

		return { color: hex, ratio: atLightness(startL).worst };
	}

	let best: { hex: string; ratio: number; distance: number } | null = null;

	for (const direction of [-1, 1] as const) {
		for (
			let l = startL + direction * LIGHTNESS_STEP;
			l >= 0 && l <= 1;
			l += direction * LIGHTNESS_STEP
		) {
			const { candidate, worst } = atLightness(l);

			if (worst >= target) {
				const hex = formatHex(candidate)?.toLowerCase();

				if (hex) {
					const distance = Math.abs(l - startL);

					if (!best || distance < best.distance) {
						best = { hex, ratio: worst, distance };
					}
				}

				break; // nearest passing lightness in this direction
			}
		}
	}

	return best ? { color: best.hex, ratio: best.ratio } : null;
}

const LIGHTNESS_STEP = 0.002;

const clampOklch = (l: number, c: number, h: number): Color =>
	clampChroma({ mode: "oklch", l, c, h }, "oklch");

/**
 * Nearest foreground color that reaches `target` against `background`.
 *
 * Search walks OKLCH lightness away from the current value in both
 * directions, preserving hue and chroma (achromatic colors stay achromatic).
 * Chroma is clamped into sRGB gamut via culori's clampChroma before every
 * measurement, so any returned color is usable. The returned ratio is
 * re-measured on the clamped color — never the unclamped probe.
 *
 * Returns null when no lightness can reach the target
 * (e.g. mid-luminance backgrounds for AAA).
 */
export function suggestPassingColor(
	foreground: string,
	background: string,
	target: number,
): Suggestion | null {
	const fg = parse(foreground);
	const bg = parse(background);
	if (!fg || !bg) return null;

	const oklch = toOklch(fg);
	if (!oklch) return null;

	const startL = clamp01(typeof oklch.l === "number" ? oklch.l : 0.5);
	const startC = typeof oklch.c === "number" ? oklch.c : 0;
	const startH = typeof oklch.h === "number" ? oklch.h : 0;

	// Already passing at this lightness — nearest passing color is itself.
	if (wcagContrast(fg, bg) >= target) {
		const self = clampOklch(startL, startC, startH);
		const hex = formatHex(self)?.toLowerCase();

		if (!hex) return null;

		const ratio = wcagContrast(self, bg);
		return { color: hex, ratio };
	}

	let best: { hex: string; ratio: number; distance: number } | null = null;

	for (const direction of [-1, 1] as const) {
		for (
			let l = startL + direction * LIGHTNESS_STEP;
			l >= 0 && l <= 1;
			l += direction * LIGHTNESS_STEP
		) {
			const candidate = clampOklch(l, startC, startH);
			const ratio = wcagContrast(candidate, bg);

			if (ratio >= target) {
				const hex = formatHex(candidate)?.toLowerCase();
				const hexUpper = hex && /^[a-f0-9]{6}$/.test(hex.slice(1)) ? hex : null;

				if (hexUpper) {
					const distance = Math.abs(l - startL);

					if (!best || distance < best.distance) {
						best = { hex: hexUpper, ratio, distance };
					}
				}

				break; // first hit in this direction is nearest to startL
			}
		}
	}

	return best ? { color: best.hex, ratio: best.ratio } : null;
}
