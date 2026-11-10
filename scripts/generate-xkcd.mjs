import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";

const SOURCE_URL = "https://xkcd.com/color/rgb.txt";
const snapshotUrl = new URL("./data/xkcd-rgb.txt", import.meta.url);
const outputUrl = new URL("../src/lib/colors/xkcd.ts", import.meta.url);

/**
 * The survey is CC0, but a handful of names are scatological. They are omitted
 * from the bundled copy so the reference stays presentable in a design tool.
 * Everything else, including typos and crude-but-mild names, is preserved.
 */
const OMITTED = /\b(shit|piss|poop|poo|diarrhea|vomit|puke)\b/i;

async function loadSource() {
  if (existsSync(snapshotUrl)) return readFileSync(snapshotUrl, "utf8");

  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Could not download ${SOURCE_URL}: ${response.status}`);
  }

  const text = await response.text();
  mkdirSync(new URL("./data/", import.meta.url), { recursive: true });
  writeFileSync(snapshotUrl, text);
  return text;
}

const raw = await loadSource();
const seen = new Map();

for (const line of raw.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;

  const [rawName, rawHex] = line.split("\t");
  const name = rawName?.trim();
  const hex = rawHex?.trim().toLowerCase();

  if (!name || !hex || !/^#[0-9a-f]{6}$/.test(hex)) continue;
  if (OMITTED.test(name)) continue;
  if (seen.has(name)) continue;

  seen.set(name, hex);
}

const entries = [...seen.entries()].sort(([a], [b]) => a.localeCompare(b));

const lines = [
  "// Generated from the XKCD color survey. Do not hand-edit values.",
  "// Source: https://xkcd.com/color/rgb.txt (CC0 1.0)",
  "// Regenerate with: node scripts/generate-xkcd.mjs",
  "// Explicit scatological names are omitted from this bundled copy.",
  "",
  `export const XKCD_SOURCE = "${SOURCE_URL}";`,
  'export const XKCD_LICENSE = "CC0 1.0";',
  "",
  "export const XKCD_COLORS = [",
];

for (const [name, hex] of entries) {
  lines.push(`  [${JSON.stringify(name)}, "${hex}"],`);
}

lines.push('] as const satisfies readonly (readonly [string, string])[];');
lines.push("");

writeFileSync(outputUrl, lines.join("\n"));

console.log(`Wrote ${entries.length} XKCD colors.`);
