import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { formatHex, parse } from "culori";
import { describe, expect, it } from "vitest";
import {
	ALL_NAMED_COLORS,
	CSS_NAMED_COLORS,
	TAILWIND_SHADES,
	TAILWIND_V4_COLORS,
	TAILWIND_V4_FAMILIES,
	TAILWIND_V4_VERSION,
	XKCD_COLORS,
	XKCD_NAMED_COLORS,
	countColorsByCollection,
	filterColorsByCollection,
	findNearestColors,
	groupTailwindColors,
	lightnessOf,
	searchNamedColors,
	sortNamedColors,
} from "@/lib/colors";

const require = createRequire(import.meta.url);

const ALIAS_PAIRS = [
	["aqua", "cyan"],
	["fuchsia", "magenta"],
	["gray", "grey"],
	["darkgray", "darkgrey"],
	["dimgray", "dimgrey"],
	["lightgray", "lightgrey"],
	["slategray", "slategrey"],
	["lightslategray", "lightslategrey"],
	["darkslategray", "darkslategrey"],
] as const;

describe("CSS named collection", () => {
	it("contains every standard opaque CSS keyword, including aliases", () => {
		expect(CSS_NAMED_COLORS).toHaveLength(148);
		expect(new Set(CSS_NAMED_COLORS.map((color) => color.name)).size).toBe(
			148,
		);
	});

	it("maps every keyword to the CSS specification value", () => {
		for (const color of CSS_NAMED_COLORS) {
			const parsed = parse(color.name);

			expect(parsed, color.name).toBeTruthy();
			expect(formatHex(parsed!), color.name).toBe(color.hex);
		}
	});

	it("preserves aliases as separate names with the same value", () => {
		const values = new Map(
			CSS_NAMED_COLORS.map((color) => [color.name, color.hex]),
		);

		for (const [first, second] of ALIAS_PAIRS) {
			expect(values.get(first), first).toBe(values.get(second));
		}

		expect(new Set(values.values()).size).toBeLessThan(CSS_NAMED_COLORS.length);
	});
});

describe("Tailwind CSS v4 collection", () => {
	it("contains 26 families with all 11 shades", () => {
		expect(TAILWIND_V4_FAMILIES).toHaveLength(26);
		expect(TAILWIND_V4_COLORS).toHaveLength(26 * 11);

		for (const family of TAILWIND_V4_FAMILIES) {
			expect(
				Object.keys(family.shades).map(Number).sort((a, b) => a - b),
			).toEqual([...TAILWIND_SHADES]);
		}
	});

	it("matches the installed official Tailwind theme values", () => {
		const packageJson = JSON.parse(
			readFileSync(require.resolve("tailwindcss/package.json"), "utf8"),
		) as { version: string };
		const theme = readFileSync(require.resolve("tailwindcss/theme.css"), "utf8");
		const published = new Map<string, string>();
		const pattern = /--color-([a-z]+-\d+):\s*(oklch\([^)]*\))\s*;/g;
		let match: RegExpExecArray | null;

		expect(packageJson.version).toBe(TAILWIND_V4_VERSION);

		while ((match = pattern.exec(theme))) {
			published.set(match[1], match[2]);
		}

		expect(published.size).toBe(TAILWIND_V4_COLORS.length);

		for (const color of TAILWIND_V4_COLORS) {
			expect(published.get(color.name), color.name).toBe(color.oklch);
		}
	});

	it("preserves Tailwind v4 values and derives HEX with culori", () => {
		const red500 = TAILWIND_V4_COLORS.find(
			(color) => color.name === "red-500",
		);

		expect(red500?.oklch).toBe("oklch(63.7% 0.237 25.331)");
		expect(red500?.hex).toBe("#fb2c36");
		expect(red500?.hex).not.toBe("#ef4444");
	});
});

describe("XKCD survey collection", () => {
	it("keeps every bundled name unique and valid", () => {
		expect(XKCD_NAMED_COLORS).toHaveLength(926);
		expect(new Set(XKCD_NAMED_COLORS.map((color) => color.name)).size).toBe(
			XKCD_NAMED_COLORS.length,
		);

		for (const color of XKCD_NAMED_COLORS) {
			expect(color.hex, color.name).toMatch(/^#[0-9a-f]{6}$/);
			expect(formatHex(parse(color.hex)!), color.name).toBe(color.hex);
		}
	});

	it("gives every entry a unique id, even when slugs collide", () => {
		const ids = XKCD_NAMED_COLORS.map((color) => color.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it("omits explicit scatological names from the bundled copy", () => {
		const omitted =
			/\b(shit|piss|poop|poo|diarrhea|vomit|puke)\b/i;

		for (const [name] of XKCD_COLORS) {
			expect(name, name).not.toMatch(omitted);
		}
	});

	it("preserves the survey's original spellings", () => {
		const names = new Set(XKCD_NAMED_COLORS.map((color) => color.name));

		expect(names.has("liliac")).toBe(true);
		expect(names.has("toupe")).toBe(true);
		expect(names.has("robin's egg")).toBe(true);
	});
});

describe("named color integrity", () => {
	it("uses valid six-digit HEX for every color", () => {
		for (const color of ALL_NAMED_COLORS) {
			expect(color.hex, color.id).toMatch(/^#[0-9a-f]{6}$/);
			expect(formatHex(parse(color.hex)!), color.id).toBe(color.hex);
		}
	});

	it("uses a unique id for every color", () => {
		const ids = ALL_NAMED_COLORS.map((color) => color.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it("keeps the collection identities and counts intact", () => {
		expect(countColorsByCollection(ALL_NAMED_COLORS)).toEqual({
			all: 1360,
			css: 148,
			tailwind: 286,
			xkcd: 926,
		});
	});
});

describe("searchNamedColors", () => {
	it("matches names by substring", () => {
		const names = searchNamedColors(CSS_NAMED_COLORS, "cornflower").map(
			(color) => color.name,
		);

		expect(names).toEqual(["cornflowerblue"]);
	});

	it("matches Tailwind family and shade with or without a separator", () => {
		expect(
			searchNamedColors(TAILWIND_V4_COLORS, "red 500").map(
				(color) => color.name,
			),
		).toEqual(["red-500"]);
		expect(
			searchNamedColors(TAILWIND_V4_COLORS, "blue-800").map(
				(color) => color.name,
			),
		).toEqual(["blue-800"]);
	});

	it("matches HEX with and without a leading hash", () => {
		expect(
			searchNamedColors(CSS_NAMED_COLORS, "#00ffff").map(
				(color) => color.name,
			),
		).toEqual(["aqua", "cyan"]);

		expect(
			searchNamedColors(TAILWIND_V4_COLORS, "fb2c36").map(
				(color) => color.name,
			),
		).toContain("red-500");
	});

	it("returns the original collection for an empty query", () => {
		expect(searchNamedColors(ALL_NAMED_COLORS, "   ")).toBe(
			ALL_NAMED_COLORS,
		);
	});

	it("ignores spaces, hyphens, and punctuation in names", () => {
		expect(
			searchNamedColors(XKCD_NAMED_COLORS, "robin's egg").map(
				(color) => color.name,
			),
		).toContain("robin's egg");

		expect(
			searchNamedColors(XKCD_NAMED_COLORS, "robins egg").map(
				(color) => color.name,
			),
		).toContain("robin's egg");

		expect(
			searchNamedColors(XKCD_NAMED_COLORS, "blue/green").map(
				(color) => color.name,
			),
		).toEqual(expect.arrayContaining(["blue/green", "blue green"]));
	});

	it("combines search results with collection filters", () => {
		const results = searchNamedColors(ALL_NAMED_COLORS, "blue");
		const css = filterColorsByCollection(results, "css");
		const tailwind = filterColorsByCollection(results, "tailwind");
		const xkcd = filterColorsByCollection(results, "xkcd");

		expect(css.length).toBeGreaterThan(0);
		expect(tailwind.length).toBeGreaterThan(0);
		expect(xkcd.length).toBeGreaterThan(0);
		expect(css.every((color) => color.collection === "css")).toBe(true);
		expect(tailwind.every((color) => color.collection === "tailwind")).toBe(
			true,
		);
		expect(xkcd.every((color) => color.collection === "xkcd")).toBe(true);
		expect(css.length + tailwind.length + xkcd.length).toBe(results.length);
	});
});

describe("sortNamedColors", () => {
	it("sorts alphabetically by default", () => {
		const sorted = sortNamedColors(CSS_NAMED_COLORS, "name");

		expect(sorted.map((color) => color.name)).toEqual(
			[...sorted.map((color) => color.name)].sort((a, b) =>
				a.localeCompare(b),
			),
		);
	});

	it("orders hues as a spectrum and keeps achromatic colors last", () => {
		const picks = ["white", "blue", "red", "lime"].map(
			(name) => CSS_NAMED_COLORS.find((color) => color.name === name)!,
		);
		const sorted = sortNamedColors(picks, "hue").map((color) => color.name);

		expect(sorted).toEqual(["red", "lime", "blue", "white"]);
	});

	it("does not mutate the input array", () => {
		const input = [...CSS_NAMED_COLORS].slice(0, 5);
		const before = input.map((color) => color.id);

		sortNamedColors(input, "hue");

		expect(input.map((color) => color.id)).toEqual(before);
	});
});

describe("findNearestColors", () => {
	it("finds an exact CSS match with zero distance", () => {
		const [css] = findNearestColors("#ff0000");

		expect(css.collection).toBe("css");
		expect(css.color.name).toBe("red");
		expect(css.distance).toBeCloseTo(0, 5);
	});

	it("returns one match per collection", () => {
		const matches = findNearestColors("#3b82f6");

		expect(matches.map((match) => match.collection)).toEqual([
			"css",
			"tailwind",
			"xkcd",
		]);
		expect(matches.every((match) => match.distance >= 0)).toBe(true);
	});

	it("matches a color written in another model", () => {
		const [css] = findNearestColors("oklch(62.8% 0.2577 29.23)");

		expect(css.color.name).toBe("red");
	});

	it("returns nothing for an invalid value", () => {
		expect(findNearestColors("not a color")).toEqual([]);
		expect(findNearestColors("")).toEqual([]);
	});
});

describe("lightnessOf", () => {
	it("separates light from dark swatches for on-chip ink", () => {
		expect(lightnessOf("#ffffff")).toBeCloseTo(1, 2);
		expect(lightnessOf("#000000")).toBeCloseTo(0, 2);
		expect(lightnessOf("#ffff00")).toBeGreaterThan(0.65);
		expect(lightnessOf("#0000ff")).toBeLessThan(0.65);
	});
});

describe("groupTailwindColors", () => {
	it("groups visible shades by their original family", () => {
		const groups = groupTailwindColors(TAILWIND_V4_COLORS);

		expect(groups).toHaveLength(26);
		expect(groups[0].family).toBe("red");
		expect(groups.every((group) => group.colors.length === 11)).toBe(true);
	});

	it("drops empty families while keeping shade order", () => {
		const groups = groupTailwindColors(
			searchNamedColors(TAILWIND_V4_COLORS, "red-500"),
		);

		expect(groups).toHaveLength(1);
		expect(groups[0].family).toBe("red");
		expect(groups[0].colors.map((color) => color.name)).toEqual(["red-500"]);
	});
});
