import type { TailwindShade } from "./tailwind-v4";

export const COLOR_COLLECTION_IDS = ["css", "tailwind", "xkcd"] as const;

export type ColorCollectionId = (typeof COLOR_COLLECTION_IDS)[number];

export interface ColorCollection {
  readonly id: ColorCollectionId;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly source: string;
  readonly sourceUrl: string;
  readonly license: string;
  readonly version: string;
}

export interface NamedColor {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
  readonly collection: ColorCollectionId;
  readonly oklch?: string;
  readonly family?: string;
  readonly shade?: TailwindShade;
}

export interface TailwindFamilyGroup {
  readonly family: string;
  readonly colors: readonly NamedColor[];
}

export const COLLECTION_FILTER_VALUES = [
  "all",
  "css",
  "tailwind",
  "xkcd",
] as const;

export type CollectionFilterValue = (typeof COLLECTION_FILTER_VALUES)[number];

/** Flat collections can be listed alphabetically or as a hue spectrum. */
export const NAME_SORT_VALUES = ["name", "hue"] as const;

export type NameSortValue = (typeof NAME_SORT_VALUES)[number];

export interface NearestColorMatch {
  readonly collection: ColorCollectionId;
  readonly color: NamedColor;
  /** CIEDE2000 distance; 0 means an exact match. */
  readonly distance: number;
}
