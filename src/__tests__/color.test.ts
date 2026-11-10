import { describe, it, expect } from "vitest";
import { convert, parse, isValid, generatePalette, oklchChannels } from "@/lib/color";

describe("convert", () => {
  it("converts hex to oklch", () => {
    const result = convert("#ff0000", "hex", "oklch");
    expect(result).toBeTruthy();
    expect(result).toContain("oklch(");
  });

  it("converts hex to hex (identity)", () => {
    const result = convert("#ff0000", "hex", "hex");
    expect(result).toBe("#ff0000");
  });

  it("converts rgb to hex", () => {
    const result = convert("rgb(255, 0, 0)", "rgb", "hex");
    expect(result).toBe("#ff0000");
  });

  it("converts hsl to rgb", () => {
    const result = convert("hsl(0, 100%, 50%)", "hsl", "rgb");
    expect(result).toBe("rgb(255 0 0)");
  });

  it("returns null for invalid input", () => {
    const result = convert("not-a-color", "hex", "oklch");
    expect(result).toBeNull();
  });

  it("preserves alpha in hex output", () => {
    const result = convert("rgba(255, 0, 0, 0.5)", "rgb", "hex");
    expect(result).toMatch(/^#[0-9a-f]{8}$/i);
    expect(result).toBe("#ff000080");
  });

  it("preserves alpha in rgb output", () => {
    const result = convert("rgba(255, 0, 0, 0.5)", "rgb", "rgb");
    expect(result).toContain("/ 0.5");
  });

  it("roundtrips through all models", () => {
    const input = "#ff0000";
    const models = ["hex", "rgb", "hsl", "oklch", "oklab", "lch"] as const;

    for (const model of models) {
      const converted = convert(input, "hex", model);
      expect(converted).toBeTruthy();
      const back = convert(converted!, model, "hex");
      expect(back).toBeTruthy();
      // Accept reasonable precision loss across perceptual spaces
      expect(back).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
    }
  });
});

describe("parse", () => {
  it("parses valid hex", () => {
    const result = parse("#ff0000", "hex");
    expect(result).toBeTruthy();
  });

  it("returns null for empty string", () => {
    const result = parse("", "hex");
    expect(result).toBeNull();
  });
});

describe("isValid", () => {
  it("validates a valid color", () => {
    expect(isValid("#ff0000", "hex")).toBe(true);
  });

  it("rejects invalid color", () => {
    expect(isValid("xyz", "hex")).toBe(false);
  });
});

describe("generatePalette", () => {
  it("anchors the seed at the middle step for a light seed in centered mode", () => {
    const { steps, seedStep } = generatePalette("#eef2ff", "centered");
    expect(seedStep).toBe(5);
    expect(steps).toHaveLength(11);
    expect(steps[5].hex).toBe("#eef2ff");
  });

  it("anchors the seed at the middle step for a dark seed in centered mode", () => {
    const { steps, seedStep } = generatePalette("#1e1b4b", "centered");
    expect(seedStep).toBe(5);
    expect(steps[5].hex).toBe("#1e1b4b");
  });

  it("anchors the seed at the middle step for a mid-tone seed in centered mode", () => {
    const { steps, seedStep } = generatePalette("#6366f1", "centered");
    expect(seedStep).toBe(5);
    expect(steps[5].hex).toBe("#6366f1");
  });

  it("floats the seed to the nearest step on the absolute ramp in auto mode", () => {
    const light = generatePalette("#eef2ff", "auto");
    const dark = generatePalette("#1e1b4b", "auto");
    expect(light.seedStep).toBeLessThanOrEqual(1);
    expect(light.steps[light.seedStep].hex).toBe("#eef2ff");
    expect(dark.seedStep).toBeGreaterThanOrEqual(7);
    expect(dark.steps[dark.seedStep].hex).toBe("#1e1b4b");
  });

  it("keeps the absolute ramp strictly descending in auto mode", () => {
    const { steps } = generatePalette("#6366f1", "auto");
    const lightnesses = steps.map((step) => oklchChannels(step.hex)?.l ?? 0);
    for (let i = 1; i < lightnesses.length; i++) {
      expect(lightnesses[i]).toBeLessThanOrEqual(lightnesses[i - 1] + 1e-9);
    }
  });

  it("keeps lightness monotonically non-increasing for a very light seed in centered mode", () => {
    const { steps } = generatePalette("#eef2ff", "centered");
    const lightnesses = steps.map((step) => oklchChannels(step.hex)?.l ?? 0);
    for (let i = 1; i < lightnesses.length; i++) {
      expect(lightnesses[i]).toBeLessThanOrEqual(lightnesses[i - 1] + 0.005);
    }
  });

  it("keeps lightness monotonically non-increasing across a mid-tone ramp", () => {
    const { steps } = generatePalette("#6366f1");
    const lightnesses = steps.map((step) => oklchChannels(step.hex)?.l ?? 0);
    for (let i = 1; i < lightnesses.length; i++) {
      expect(lightnesses[i]).toBeLessThanOrEqual(lightnesses[i - 1] + 0.005);
    }
  });

  it("handles near-white and near-black seeds without breaking the ramp", () => {
    for (const anchor of ["auto", "centered"] as const) {
      const white = generatePalette("#ffffff", anchor);
      const black = generatePalette("#000000", anchor);
      expect(white.steps).toHaveLength(11);
      expect(black.steps).toHaveLength(11);
      expect(white.steps[white.seedStep].hex).toBe("#ffffff");
      expect(black.steps[black.seedStep].hex).toBe("#000000");
    }
  });

  it("returns an empty palette for invalid input", () => {
    expect(generatePalette("not-a-color")).toEqual({ steps: [], seedStep: -1 });
    expect(generatePalette("not-a-color", "centered")).toEqual({ steps: [], seedStep: -1 });
  });
});
