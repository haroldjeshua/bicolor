import { describe, it, expect } from "vitest";
import { suggestAccent } from "@/lib/color";
import { oklchChannels, colorDistance } from "@/lib/color";

describe("suggestAccent", () => {
	it("returns a valid hex for complementary mode", () => {
		const result = suggestAccent("#6366f1", "#f59e0b", "complementary");
		expect(result).toBeTruthy();
		expect(result).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("returns a valid hex for analogous mode", () => {
		const result = suggestAccent("#6366f1", "#f59e0b", "analogous");
		expect(result).toBeTruthy();
		expect(result).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("returns a valid hex for triadic mode", () => {
		const result = suggestAccent("#6366f1", "#f59e0b", "triadic");
		expect(result).toBeTruthy();
		expect(result).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("complementary accent hue is ~180 degrees from c1", () => {
		const result = suggestAccent("#ff0000", "#00ff00", "complementary");
		expect(result).toBeTruthy();
		const accentChannels = oklchChannels(result!);
		const c1Channels = oklchChannels("#ff0000");
		expect(accentChannels).toBeTruthy();
		expect(c1Channels).toBeTruthy();
		const delta = ((accentChannels!.h ?? 0) - (c1Channels!.h ?? 0) + 360) % 360;
		expect(Math.abs(delta - 180)).toBeLessThan(15);
	});

	it("triadic accent hue is ~120 degrees from c1", () => {
		const result = suggestAccent("#ff0000", "#00ff00", "triadic");
		expect(result).toBeTruthy();
		const accentChannels = oklchChannels(result!);
		const c1Channels = oklchChannels("#ff0000");
		expect(accentChannels).toBeTruthy();
		expect(c1Channels).toBeTruthy();
		const delta = ((accentChannels!.h ?? 0) - (c1Channels!.h ?? 0) + 360) % 360;
		const triadicDelta = Math.min(Math.abs(delta - 120), Math.abs(delta - 240));
		expect(triadicDelta).toBeLessThan(15);
	});

	it("returns null for invalid inputs", () => {
		expect(suggestAccent("not-a-color", "#000000", "complementary")).toBeNull();
		expect(suggestAccent("#000000", "not-a-color", "complementary")).toBeNull();
	});

	it("accent differs from both dominant colors", () => {
		const result = suggestAccent("#6366f1", "#f59e0b", "complementary");
		expect(result).toBeTruthy();
		expect(colorDistance("#6366f1", result!)).toBeGreaterThan(5);
		expect(colorDistance("#f59e0b", result!)).toBeGreaterThan(5);
	});
});
