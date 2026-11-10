import {
  convert,
  distanceCiede2000,
  oklchChannels,
  parse,
  type OklchChannels,
} from "@/lib/color";
import { CSS_NAMED_COLORS } from "./css-named";
import {
  TAILWIND_SHADES,
  TAILWIND_V4_FAMILIES,
  TAILWIND_V4_SOURCE,
  TAILWIND_V4_VERSION,
} from "./tailwind-v4";
import { XKCD_COLORS, XKCD_LICENSE, XKCD_SOURCE } from "./xkcd";
import {
  COLOR_COLLECTION_IDS,
  type ColorCollection,
  type ColorCollectionId,
  type CollectionFilterValue,
  type NamedColor,
  type NameSortValue,
  type NearestColorMatch,
  type TailwindFamilyGroup,
} from "./types";

export * from "./css-named";
export * from "./tailwind-v4";
export * from "./xkcd";
export * from "./types";

export const CSS_COLLECTION: ColorCollection = {
  id: "css",
  name: "CSS Named Colors",
  shortName: "CSS",
  description: "Every standard opaque CSS color keyword, including aliases.",
  source: "CSS Color Module Level 4",
  sourceUrl: "https://www.w3.org/TR/css-color/#named-colors",
  license: "W3C",
  version: "CSS Color 4",
};

export const TAILWIND_COLLECTION: ColorCollection = {
  id: "tailwind",
  name: "Tailwind CSS v4",
  shortName: "Tailwind",
  description: "The official default palette, 11 shades per family.",
  source: `Tailwind CSS v${TAILWIND_V4_VERSION}`,
  sourceUrl: TAILWIND_V4_SOURCE,
  license: "MIT",
  version: TAILWIND_V4_VERSION,
};

export const XKCD_COLLECTION: ColorCollection = {
  id: "xkcd",
  name: "XKCD Color Survey",
  shortName: "XKCD",
  description: "Crowdsourced everyday names from the XKCD color survey.",
  source: "XKCD Color Survey",
  sourceUrl: XKCD_SOURCE,
  license: XKCD_LICENSE,
  version: "2010",
};

export const COLOR_COLLECTIONS: readonly ColorCollection[] = [
  CSS_COLLECTION,
  TAILWIND_COLLECTION,
  XKCD_COLLECTION,
];

export const COLOR_COLLECTION_MAP: Readonly<
  Record<ColorCollectionId, ColorCollection>
> = {
  css: CSS_COLLECTION,
  tailwind: TAILWIND_COLLECTION,
  xkcd: XKCD_COLLECTION,
};

const ACHROMATIC_CHROMA = 0.02;

function toHex(oklch: string): string {
  const hex = convert(oklch, "oklch", "hex");

  if (!hex) {
    throw new Error(`Could not convert Tailwind color: ${oklch}`);
  }

  return hex.toLowerCase();
}

/**
 * Tailwind values are kept exactly as published in the official theme source.
 * HEX is derived through the project's culori wrapper rather than stored twice.
 */
export const TAILWIND_V4_COLORS: readonly NamedColor[] =
  TAILWIND_V4_FAMILIES.flatMap((family) =>
    TAILWIND_SHADES.map((shade) => ({
      id: `tailwind:${family.name}-${shade}`,
      name: `${family.name}-${shade}`,
      hex: toHex(family.shades[shade]),
      oklch: family.shades[shade],
      collection: "tailwind" as const,
      family: family.name,
      shade,
    })),
  );

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The survey contains names that differ only in punctuation ("blue/green" and
 * "blue green"), so colliding slugs get a stable numeric suffix.
 */
function buildXkcdColors(): readonly NamedColor[] {
  const used = new Map<string, number>();

  return XKCD_COLORS.map(([name, hex]) => {
    const base = `xkcd:${slugify(name)}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);

    return {
      id: seen === 0 ? base : `${base}-${seen + 1}`,
      name,
      hex,
      collection: "xkcd" as const,
    };
  });
}

export const XKCD_NAMED_COLORS: readonly NamedColor[] = buildXkcdColors();

export const ALL_NAMED_COLORS: readonly NamedColor[] = [
  ...CSS_NAMED_COLORS,
  ...TAILWIND_V4_COLORS,
  ...XKCD_NAMED_COLORS,
];

export const COLLECTION_COUNTS: Readonly<Record<ColorCollectionId, number>> = {
  css: CSS_NAMED_COLORS.length,
  tailwind: TAILWIND_V4_COLORS.length,
  xkcd: XKCD_NAMED_COLORS.length,
};

export function isCollectionFilterValue(
  value: string | null,
): value is CollectionFilterValue {
  return (
    value === "all" ||
    value === "css" ||
    value === "tailwind" ||
    value === "xkcd"
  );
}

export function isNameSortValue(value: string | null): value is NameSortValue {
  return value === "name" || value === "hue";
}

/** Letters and digits only, so "robin's egg", "red 500", and "#fb2c36" all match. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Matches names, family-shade pairs, and HEX fragments.
 *
 * Name matching ignores spaces, punctuation, and hyphens so "alice blue",
 * "robin's egg", and "red 500" work. HEX matching accepts an optional leading
 * "#" and partial values of 3+ digits.
 */
export function searchNamedColors(
  colors: readonly NamedColor[],
  query: string,
): readonly NamedColor[] {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) return colors;

  const nameQuery = normalize(trimmed);
  if (!nameQuery) return colors;

  const hexQuery = trimmed.replace(/^#/, "");
  const hasHexQuery = hexQuery.length >= 3 && /^[0-9a-f]+$/.test(hexQuery);

  return colors.filter((color) => {
    if (normalize(color.name).includes(nameQuery)) return true;
    if (hasHexQuery && color.hex.slice(1).includes(hexQuery)) return true;

    return false;
  });
}

export function filterColorsByCollection(
  colors: readonly NamedColor[],
  filter: CollectionFilterValue,
): readonly NamedColor[] {
  if (filter === "all") return colors;

  return colors.filter((color) => color.collection === filter);
}

export function countColorsByCollection(
  colors: readonly NamedColor[],
): Readonly<Record<CollectionFilterValue, number>> {
  const counts = { all: colors.length, css: 0, tailwind: 0, xkcd: 0 };

  for (const color of colors) counts[color.collection] += 1;

  return counts;
}

const channelsCache = new Map<string, OklchChannels | null>();

function channelsOf(hex: string): OklchChannels | null {
  if (!channelsCache.has(hex)) channelsCache.set(hex, oklchChannels(hex));
  return channelsCache.get(hex) ?? null;
}

/** OKLCH lightness, used to pick readable ink for text drawn on a swatch. */
export function lightnessOf(hex: string): number {
  return channelsOf(hex)?.l ?? 0.5;
}

function compareByHue(a: NamedColor, b: NamedColor): number {
  const first = channelsOf(a.hex);
  const second = channelsOf(b.hex);
  const firstAchromatic = !first || first.c < ACHROMATIC_CHROMA;
  const secondAchromatic = !second || second.c < ACHROMATIC_CHROMA;

  // Greys, whites, and blacks sit at the end so the grid reads as a spectrum.
  if (firstAchromatic !== secondAchromatic) return firstAchromatic ? 1 : -1;
  if (firstAchromatic) return (second?.l ?? 0) - (first?.l ?? 0);

  const hueDelta = (first?.h ?? 0) - (second?.h ?? 0);
  if (Math.abs(hueDelta) > 0.5) return hueDelta;

  return (second?.l ?? 0) - (first?.l ?? 0);
}

export function sortNamedColors(
  colors: readonly NamedColor[],
  sort: NameSortValue,
): readonly NamedColor[] {
  const sorted = [...colors];

  if (sort === "hue") return sorted.sort(compareByHue);

  return sorted.sort((a, b) => a.name.localeCompare(b.name));
}

interface ParsedCandidate {
  readonly color: NamedColor;
  readonly parsed: NonNullable<ReturnType<typeof parse>>;
}

let nearestIndex: readonly ParsedCandidate[] | null = null;

function getNearestIndex(): readonly ParsedCandidate[] {
  if (nearestIndex) return nearestIndex;

  const entries: ParsedCandidate[] = [];

  for (const color of ALL_NAMED_COLORS) {
    const parsed = parse(color.hex);

    if (parsed) entries.push({ color, parsed });
  }

  nearestIndex = entries;
  return entries;
}

/**
 * Closest named color in each collection by CIEDE2000 distance.
 * Exact matches come back with a distance of 0.
 */
export function findNearestColors(
  input: string,
): readonly NearestColorMatch[] {
  const parsed = parse(input);
  if (!parsed) return [];

  const best = new Map<ColorCollectionId, NearestColorMatch>();

  for (const candidate of getNearestIndex()) {
    const distance = distanceCiede2000(parsed, candidate.parsed);
    const current = best.get(candidate.color.collection);

    if (!current || distance < current.distance) {
      best.set(candidate.color.collection, {
        collection: candidate.color.collection,
        color: candidate.color,
        distance,
      });
    }
  }

  return COLOR_COLLECTION_IDS.flatMap((id) => {
    const match = best.get(id);
    return match ? [match] : [];
  });
}

export function groupTailwindColors(
  colors: readonly NamedColor[],
): readonly TailwindFamilyGroup[] {
  const byFamily = new Map<string, NamedColor[]>();

  for (const color of colors) {
    if (color.collection !== "tailwind" || !color.family) continue;

    const group = byFamily.get(color.family);

    if (group) group.push(color);
    else byFamily.set(color.family, [color]);
  }

  return TAILWIND_V4_FAMILIES.flatMap((family) => {
    const familyColors = byFamily.get(family.name);

    return familyColors?.length
      ? [{ family: family.name, colors: familyColors }]
      : [];
  });
}
