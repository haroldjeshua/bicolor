import { converter, parse } from "culori";
import { describe, expect, it } from "vitest";
import {
	WCAG_THRESHOLDS,
	evaluateContrast,
	suggestPassingColor,
	suggestPassingColorMulti,
	wcagRatio,
} from "@/lib/contrast";
import { analyzeGradientContrast } from "@/lib/gradient-contrast";

describe("wcagRatio", () => {
	it("returns 21:1 for black on white", () => {
		expect(wcagRatio("#000000", "#ffffff")).toBe(21);
	});

	it("returns 21:1 for white on black", () => {
		expect(wcagRatio("#ffffff", "#000000")).toBe(21);
	});

	it("returns 1:1 for identical colors", () => {
		expect(wcagRatio("#6366f1", "#6366f1")).toBe(1);
		expect(wcagRatio("#ffffff", "#ffffff")).toBe(1);
	});

	it("is independent of argument order", () => {
		expect(wcagRatio("#123456", "#fedcba")).toBe(wcagRatio("#fedcba", "#123456"));
	});

	it("returns null for invalid input", () => {
		expect(wcagRatio("not a color", "#ffffff")).toBeNull();
		expect(wcagRatio("#ffffff", "garbage")).toBeNull();
		expect(wcagRatio("", "#ffffff")).toBeNull();
	});

	it("accepts named colors and rgb()", () => {
		expect(wcagRatio("black", "white")).toBe(21);
		expect(wcagRatio("rgb(0, 0, 0)", "#fff")).toBe(21);
	});
});

describe("evaluateContrast", () => {
	it("passes nothing at 1:1", () => {
		const result = evaluateContrast(1);

		expect(result.aa.normal).toBe(false);
		expect(result.aa.large).toBe(false);
		expect(result.aaa.normal).toBe(false);
		expect(result.aaa.large).toBe(false);
		expect(result.nonTextUI).toBe(false);
	});

	it("passes only the 3:1 criteria at exactly 3:1", () => {
		const result = evaluateContrast(WCAG_THRESHOLDS.nonTextUI);

		expect(result.aa.large).toBe(true);
		expect(result.nonTextUI).toBe(true);
		expect(result.aa.normal).toBe(false);
		expect(result.aaa.large).toBe(false);
	});

	it("passes AA normal and AAA large at exactly 4.5:1", () => {
		const result = evaluateContrast(WCAG_THRESHOLDS.aaNormal);

		expect(result.aa.normal).toBe(true);
		expect(result.aaa.large).toBe(true);
		expect(result.aaa.normal).toBe(false);
	});

	it("passes everything at exactly 7:1", () => {
		const result = evaluateContrast(WCAG_THRESHOLDS.aaaNormal);

		expect(result.aa.normal).toBe(true);
		expect(result.aaa.normal).toBe(true);
		expect(result.aaa.large).toBe(true);
	});
});

describe("suggestPassingColorMulti", () => {
	const multiBackgrounds = ["#ffffff", "#e6e6e6"];

	it("returns a color passing at EVERY sampled background", () => {
		const result = suggestPassingColorMulti("#fca5a5", multiBackgrounds, 4.5)!;

		expect(result).not.toBeNull();

		for (const background of multiBackgrounds) {
			expect(wcagRatio(result.color, background)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("returns null when no color passes the full range", () => {
		// Mid-grey and near-black: nothing reaches 7:1 against #808080 (max ~5.3).
		expect(
			suggestPassingColorMulti("#fca5a5", ["#808080", "#000000"], 7),
		).toBeNull();
	});

	it("returns the foreground unchanged when it already passes everywhere", () => {
		const result = suggestPassingColorMulti("#000000", ["#ffffff", "#eeeeee"], 4.5)!;

		expect(result).not.toBeNull();
		expect(result.ratio).toBeGreaterThanOrEqual(4.5);

		for (const background of ["#ffffff", "#eeeeee"]) {
			expect(wcagRatio(result.color, background)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it("returns null for empty/invalid backgrounds", () => {
		expect(suggestPassingColorMulti("#000000", [], 4.5)).toBeNull();
		expect(suggestPassingColorMulti("#000000", ["nonsense"], 4.5)).toBeNull();
		expect(suggestPassingColorMulti("nope", ["#ffffff"], 4.5)).toBeNull();
	});

	it("handles a real narrow-range gradient's sampled colors", () => {
		// Narrow luminance range: a light background where dark text passes everywhere.
		const report = analyzeGradientContrast("#ffffff", [
			{ color: "#ffffff", position: 0 },
			{ color: "#d0d0d0", position: 100 },
		])!;

		expect(report).not.toBeNull();

		const sampledBackgrounds = report.samples.map((sample) => sample.color);

		const result = suggestPassingColorMulti(
			"#fca5a5",
			sampledBackgrounds,
			WCAG_THRESHOLDS.aaNormal,
		)!;

		expect(result).not.toBeNull();

		for (const background of sampledBackgrounds) {
			expect(wcagRatio(result.color, background)).toBeGreaterThanOrEqual(
				WCAG_THRESHOLDS.aaNormal,
			);
		}
	});
});

describe("suggestPassingColor", () => {
	it("suggests black for white on black targets", () => {
		const result = suggestPassingColor("#fca5a5", "#000000", 7);

		expect(result).not.toBeNull();
		expect(result?.ratio).toBeGreaterThanOrEqual(7);
	});

	it("suggests a color whose actual ratio meets the target", () => {
		const fg = "#6366f1";
		const bg = "#ffffff";
		const target = WCAG_THRESHOLDS.aaNormal;

		const result = suggestPassingColor(fg, bg, target);

		expect(result).not.toBeNull();
		expect(result?.ratio).toBeGreaterThanOrEqual(target);

		const check = wcagRatio(result!.color, bg);

		expect(check).not.toBeNull();
		expect(check!).toBeGreaterThanOrEqual(target);
	});

	it("suggests AAA-passing colors as well", () => {
		const result = suggestPassingColor("#94a3b8", "#ffffff", WCAG_THRESHOLDS.aaaNormal);

		expect(result).not.toBeNull();
		expect(result!.ratio).toBeGreaterThanOrEqual(WCAG_THRESHOLDS.aaaNormal);
	});

	it("preserves the hue of chromatic foregrounds", () => {
		const result = suggestPassingColor("#f97316", "#ffffff", 4.5);

		expect(result).not.toBeNull();

		const toOklch = converter("oklch");
		const originalHue = toOklch(parse("#f97316")!)!.h ?? 0;
		const suggestedHue = toOklch(parse(result!.color)!)!.h ?? 0;

		// RGB round-trip can't preserve oklch hue tighter than ~0.2°; anything
		// below 0.5° is imperceptible and confirms chroma/hue preservation.
		expect(Math.abs(suggestedHue - originalHue)).toBeLessThan(0.5);
	});

	it("handles achromatic foregrounds", () => {
		const result = suggestPassingColor("#808080", "#ffffff", 4.5);

		expect(result).not.toBeNull();
		expect(result!.ratio).toBeGreaterThanOrEqual(4.5);
	});

	it("suggests a color when the foreground already passes", () => {
		const result = suggestPassingColor("#000000", "#ffffff", 4.5);

		expect(result).not.toBeNull();
		expect(result!.ratio).toBeGreaterThanOrEqual(4.5);
	});

	it("suggests something usable for out-of-gamut oklch input", () => {
		const result = suggestPassingColor("oklch(0.7 0.3 25)", "#ffffff", 4.5);

		expect(result).not.toBeNull();

		const check = wcagRatio(result!.color, "#ffffff");

		expect(check).toBeGreaterThanOrEqual(4.5);
	});

	it("returns null when no passing color exists", () => {
		// Mid-grey background: max achievable ratio is ~5.32 against black.
		expect(suggestPassingColor("#fca5a5", "#808080", WCAG_THRESHOLDS.aaaNormal)).toBeNull();
		expect(suggestPassingColor("#fca5a5", "#808080", 5.5)).toBeNull();
	});

	it("returns null for invalid input", () => {
		expect(suggestPassingColor("nope", "#ffffff", 4.5)).toBeNull();
		expect(suggestPassingColor("#ffffff", "nope", 4.5)).toBeNull();
	});
});
