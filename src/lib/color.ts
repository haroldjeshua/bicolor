import {
  parse as culoriParse,
  formatHex,
  formatHsl,
  formatCss,
  converter,
  clampChroma,
  type Color,
} from "culori";
import { HTML_COLOR_NAMES, type ColorModel } from "./constants";

const toRgb = converter("rgb");
const toOklch = converter("oklch");
const toOklab = converter("oklab");
const toLch = converter("lch");

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function alphaToHex(alpha: number): string {
  const a = Math.round(clamp(alpha, 0, 1) * 255);
  return a.toString(16).padStart(2, "0");
}

function alphaSuffix(color: Color): string {
  const a = color.alpha ?? 1;
  if (a >= 1) return "";
  return ` / ${a.toFixed(3)}`;
}

function formatHexWithAlpha(color: Color): string {
  const rgb = toRgb(color);
  if (!rgb) return formatHex(color);
  const r = Math.round(clamp((rgb.r ?? 0) * 255, 0, 255));
  const g = Math.round(clamp((rgb.g ?? 0) * 255, 0, 255));
  const b = Math.round(clamp((rgb.b ?? 0) * 255, 0, 255));
  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  const alpha = rgb.alpha ?? 1;
  if (alpha >= 1) return hex;
  return hex + alphaToHex(alpha);
}

export function parse(value: string, _model?: ColorModel): Color | null { // eslint-disable-line @typescript-eslint/no-unused-vars
  if (!value) return null;
  try {
    const result = culoriParse(value);
    return (result ?? null) as Color | null;
  } catch {
    return null;
  }
}

export function convert(
  value: string,
  fromModel: ColorModel,
  toModel: ColorModel
): string | null {
  const color = parse(value, fromModel);
  if (!color) return null;
  return serialize(color, toModel);
}

export function serialize(color: Color, model: ColorModel): string | null {
  try {
    switch (model) {
      case "hex":
        return formatHexWithAlpha(color);
      case "rgb": {
        const c = toRgb(color);
        if (!c) return null;
        const r = Math.round(clamp((c.r ?? 0) * 255, 0, 255));
        const g = Math.round(clamp((c.g ?? 0) * 255, 0, 255));
        const b = Math.round(clamp((c.b ?? 0) * 255, 0, 255));
        return `rgb(${r} ${g} ${b}${alphaSuffix(c)})`;
      }
      case "hsl": {
        const s = formatHsl(color);
        if (!s) return null;
        const alpha = color.alpha ?? 1;
        if (alpha >= 1) return s;
        const match = s.match(/hsl\(([^)]+)\)/);
        if (match) return `hsl(${match[1]} / ${alpha.toFixed(3)})`;
        return s;
      }
      case "oklch": {
        const c = toOklch(color);
        if (!c) return null;
        const l = typeof c.l === "number" ? c.l : 0;
        const chroma = typeof c.c === "number" ? c.c : 0;
        const h = typeof c.h === "number" ? c.h : 0;
        return `oklch(${l.toFixed(4)} ${chroma.toFixed(4)} ${h.toFixed(1)}${alphaSuffix(c)})`;
      }
      case "oklab": {
        const c = toOklab(color);
        if (!c) return null;
        const l = typeof c.l === "number" ? c.l : 0;
        const a = typeof c.a === "number" ? c.a : 0;
        const b = typeof c.b === "number" ? c.b : 0;
        return `oklab(${l.toFixed(4)} ${a.toFixed(4)} ${b.toFixed(4)}${alphaSuffix(c)})`;
      }
      case "lch": {
        const c = toLch(color);
        if (!c) return null;
        const l = typeof c.l === "number" ? c.l : 0;
        const chroma = typeof c.c === "number" ? c.c : 0;
        const h = typeof c.h === "number" ? c.h : 0;
        return `lch(${l.toFixed(1)}% ${chroma.toFixed(2)} ${h.toFixed(1)}${alphaSuffix(c)})`;
      }
      default:
        return formatCss(color);
    }
  } catch {
    return null;
  }
}

export function isValid(value: string, model: ColorModel): boolean {
  return parse(value, model) !== null;
}

export function convertAll(
  value: string,
  model: ColorModel
): Record<ColorModel, string | null> {
  const color = parse(value, model);
  if (!color) {
    return {
      hex: null,
      rgb: null,
      hsl: null,
      oklch: null,
      oklab: null,
      lch: null,
    };
  }

  return {
    hex: serialize(color, "hex"),
    rgb: serialize(color, "rgb"),
    hsl: serialize(color, "hsl"),
    oklch: serialize(color, "oklch"),
    oklab: serialize(color, "oklab"),
    lch: serialize(color, "lch"),
  };
}

export function findClosestNamedColor(
  hex: string
): { name: string; hex: string } | null {
  const hexLower = hex.toLowerCase();

  const exact = HTML_COLOR_NAMES[hexLower.replace("#", "")];
  if (exact) {
    const entry = Object.entries(HTML_COLOR_NAMES).find(
      ([, v]) => v === exact
    );
    if (entry) return { name: entry[0], hex: exact };
  }

  const rgb = parse(hex, "hex");
  if (!rgb) return null;

  let closest: { name: string; hex: string; dist: number } | null = null;

  for (const [name, namedHex] of Object.entries(HTML_COLOR_NAMES)) {
    const named = parse(namedHex, "hex");
    if (!named) continue;

    const r1 = "r" in rgb ? (rgb as { r: number }).r : 0;
    const g1 = "g" in rgb ? (rgb as { g: number }).g : 0;
    const b1 = "b" in rgb ? (rgb as { b: number }).b : 0;
    const r2 = "r" in named ? (named as { r: number }).r : 0;
    const g2 = "g" in named ? (named as { g: number }).g : 0;
    const b2 = "b" in named ? (named as { b: number }).b : 0;
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    const dist = dr * dr + dg * dg + db * db;

    if (!closest || dist < closest.dist) {
      closest = { name, hex: namedHex, dist };
    }
  }

  return closest ? { name: closest.name, hex: closest.hex } : null;
}

export function alphaFromHex(hex: string): number {
  if (hex.length === 9) {
    const a = parseInt(hex.slice(7, 9), 16);
    return Math.round((a / 255) * 1000) / 1000;
  }
  return 1;
}

export interface PaletteStep {
  index: number;
  hex: string;
  rgb: string;
  hsl: string;
  oklch: string;
  oklab: string;
  lch: string;
}

export function generatePalette(seedColor: string): PaletteStep[] {
  const color = parse(seedColor);
  if (!color) return [];

  const oklchColor = toOklch(color);
  if (!oklchColor) return [];

  const chroma = typeof oklchColor.c === "number" ? oklchColor.c : 0.1;
  const hue = typeof oklchColor.h === "number" ? oklchColor.h : 0;

  const steps: PaletteStep[] = [];
  const maxLightness = 0.95;
  const minLightness = 0.05;

  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const l = maxLightness - t * (maxLightness - minLightness);

    const oklchStep = { mode: "oklch" as const, l, c: chroma, h: hue };
    const clamped = clampChroma(oklchStep);

    steps.push({
      index: i,
      hex: serialize(clamped, "hex") ?? "",
      rgb: serialize(clamped, "rgb") ?? "",
      hsl: serialize(clamped, "hsl") ?? "",
      oklch: serialize(clamped, "oklch") ?? "",
      oklab: serialize(clamped, "oklab") ?? "",
      lch: serialize(clamped, "lch") ?? "",
    });
  }

  return steps;
}
