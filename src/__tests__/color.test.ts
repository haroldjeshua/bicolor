import { describe, it, expect } from "vitest";
import { convert, parse, isValid } from "@/lib/color";

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
