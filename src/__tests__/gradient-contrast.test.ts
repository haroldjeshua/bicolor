import { describe, expect, it } from "vitest";
import {
	analyzeGradientContrast,
	solveScrim,
	type GradientStopInput,
} from "@/lib/gradient-contrast";
import { wcagRatio } from "@/lib/contrast";

const blackWhite: GradientStopInput[] = [
	{ color: "#000000", position: 0 },
	{ color: "#ffffff", position: 100 },
];

describe("solid pairs (shared assertions)", () => {
	it("black on white = 21:1", () => {
		expect(wcagRatio("#000000", "#ffffff")).toBe(21);
	});

	it("identical colors = 1:1", () => {
		expect(wcagRatio("#6366f1", "#6366f1")).toBe(1);
	});
});

describe("analyzeGradientContrast", () => {
	it("finds the weak middle of black-to-white for mid grey text", () => {
		const report = analyzeGradientContrast("#808080", blackWhite)!;

		expect(report).not.toBeNull();
		expect(report.weakest.ratio).toBeLessThan(1.1);
		expect(report.weakest.position).toBeGreaterThan(0.25);
		expect(report.weakest.position).toBeLessThan(0.75);
	});

	it("covers endpoints and multi-stop sampling", () => {
		const multi: GradientStopInput[] = [
			{ color: "#000000", position: 0 },
			{ color: "#ff0000", position: 50 },
			{ color: "#ffffff", position: 100 },
		];
		const report = analyzeGradientContrast("#808080", multi)!;

		expect(report).not.toBeNull();
		expect(report.samples[0].position).toBe(0);
		expect(report.samples[report.samples.length - 1].position).toBe(1);

		// Black segment: grey on black > 1:1
		expect(report.samples[0].ratio).toBeGreaterThan(2);
		// White segment: grey on white ≈ 3.5:1
		expect(report.samples[report.samples.length - 1].ratio).toBeGreaterThan(2);

		// The worst point sits in the interior middle (where the gradient passes the text colour)
		expect(report.weakest.ratio).toBeLessThan(1.25);
		expect(report.weakest.position).toBeGreaterThan(0);
		expect(report.weakest.position).toBeLessThan(1);
	});

	it("worst point is never better than the endpoints for a black-to-white gradient", () => {
		const report = analyzeGradientContrast("#ffffff", blackWhite)!;
		expect(report.weakest.ratio).toBeLessThanOrEqual(report.samples[0].ratio);
	});

	it("reports a 33-cell samples array sorted by position", () => {
		const report = analyzeGradientContrast("#6366f1", blackWhite)!;

		expect(report.samples).toHaveLength(33);
		expect(report.samples[0].position).toBe(0);
		expect(report.samples[32].position).toBe(1);
		expect(
			report.samples.every(
				(s, i) => i === 0 || s.position >= report.samples[i - 1].position,
			),
		).toBe(true);
	});

	it("returns null for invalid stop sets", () => {
		expect(analyzeGradientContrast("#ffffff", [])).toBeNull();
		expect(analyzeGradientContrast("#ffffff", [{ color: "#000000", position: 50 }])).toBeNull();
		expect(
			analyzeGradientContrast("#ffffff", [
				{ color: "not a color", position: 0 },
				{ color: "#ffffff", position: 100 },
			]),
		).toBeNull();
		expect(
			analyzeGradientContrast("#ffffff", [
				{ color: "#000000", position: -10 },
				{ color: "#ffffff", position: 100 },
			]),
		).toBeNull();
	});

	it("handles duplicate stop positions (later stop wins)", () => {
		const duplicated: GradientStopInput[] = [
			{ color: "#ffffff", position: 0 },
			{ color: "#ff0000", position: 50 },
			{ color: "#00ff00", position: 50 }, // wins over red at 50
			{ color: "#ffffff", position: 100 },
		];

		const report = analyzeGradientContrast("#00ff00", duplicated)!;

		expect(report).not.toBeNull();
		expect(report.samples[16].ratio).toBeCloseTo(1, 0); // middle = green on green
	});

	it("treats transparent stops as opaque without crashing", () => {
		const withAlpha: GradientStopInput[] = [
			{ color: "#00000080", position: 0 }, // 8-digit with alpha
			{ color: "#ffffff80", position: 100 },
		];

		const report = analyzeGradientContrast("#808080", withAlpha)!;

		expect(report).not.toBeNull();
		expect(report.weakest.ratio).toBeGreaterThanOrEqual(1);
		expect(report.samples).toHaveLength(33);
	});

	it("handles out-of-gamut stops via clamping", () => {
		const outOfGamut: GradientStopInput[] = [
			{ color: "oklch(0.7 0.35 25)", position: 0 },
			{ color: "#000000", position: 100 },
		];

		const report = analyzeGradientContrast("#ffffff", outOfGamut)!;

		expect(report).not.toBeNull();
		expect(report.weakest.ratio).toBeGreaterThan(1);
	});
});

describe("solveScrim", () => {
	const whiteToLightgrey: GradientStopInput[] = [
		{ color: "#ffffff", position: 0 },
		{ color: "#c0c0c0", position: 100 },
	];

	it("finds an overlay opacity that reaches the target when re-measured", () => {
		const result = solveScrim("#fca5a5", whiteToLightgrey, "#000000", 4.5)!;

		expect(result).not.toBeNull();
		expect(result.ratioAfter).toBeGreaterThanOrEqual(4.5);
	});

	it("a slightly lower opacity fails the target", () => {
		const result = solveScrim("#ff9999", whiteToLightgrey, "#000000", 4.5)!;

		expect(result.alpha).toBeGreaterThan(0);

		const composedAt = (alpha: number): GradientStopInput[] =>
			whiteToLightgrey.map((stop) => {
				const r = parseInt(stop.color.slice(1, 3), 16);
				const g = parseInt(stop.color.slice(3, 5), 16);
				const b = parseInt(stop.color.slice(5, 7), 16);
				const mix = (c: number) =>
					Math.round(c * (1 - alpha))
						.toString(16)
						.padStart(2, "0");
				return {
					color: `#${mix(r)}${mix(g)}${mix(b)}`,
					position: stop.position,
				};
			});

		const failing = analyzeGradientContrast(
			"#ff9999",
			composedAt(Math.max(0, result.alpha - 0.02)),
		)!;

		expect(failing.weakest.ratio).toBeLessThan(4.5);
		expect(result.ratioBefore).toBeLessThan(1.2);
	});

	it("returns the exact opacity needed at the boundary", () => {
		const result = solveScrim("#ff9999", whiteToLightgrey, "#000000", 4.5)!;

		expect(result).not.toBeNull();

		// Composing each stop with overlay at alpha and re-analyzing
		// must reproduce ratio >= target at alpha and fail at alpha - 0.01.
		const composedAt = (alpha: number): GradientStopInput[] =>
			whiteToLightgrey.map((stop) => {
				const r = parseInt(stop.color.slice(1, 3), 16);
				const g = parseInt(stop.color.slice(3, 5), 16);
				const b = parseInt(stop.color.slice(5, 7), 16);
				const mix = (c: number) =>
					Math.round(c * (1 - alpha))
						.toString(16)
						.padStart(2, "0");
				return {
					color: `#${mix(r)}${mix(g)}${mix(b)}`,
					position: stop.position,
				};
			});

		const passing = analyzeGradientContrast("#ff9999", composedAt(result.alpha))!;
		const failing = analyzeGradientContrast("#ff9999", composedAt(Math.max(0, result.alpha - 0.01)))!;

		expect(passing.weakest.ratio).toBeGreaterThanOrEqual(4.5);
		expect(failing.weakest.ratio).toBeLessThan(4.5);
	});

	it("returns null when no opacity can reach the target", () => {
		// White overlay can never darken anything: white fg on white bg can't pass 4.5.
		expect(
			solveScrim("#ffffff", whiteToLightgrey, "#ffffff", 4.5),
		).toBeNull();
	});

	it("returns null for invalid input", () => {
		expect(solveScrim("#fff", [], "#000000", 4.5)).toBeNull();
		expect(
			solveScrim("#fff", whiteToLightgrey, "not a color", 4.5),
		).toBeNull();
	});
});
