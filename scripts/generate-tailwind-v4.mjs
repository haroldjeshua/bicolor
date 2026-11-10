import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("tailwindcss/package.json");
const theme = readFileSync(
  require.resolve("tailwindcss/theme.css"),
  "utf8",
);

const pattern = /--color-([a-z]+)-(\d+):\s*(oklch\([^)]*\))\s*;/g;
const families = new Map();
let match;

while ((match = pattern.exec(theme))) {
  const [, family, shade, value] = match;
  if (!families.has(family)) families.set(family, []);
  families.get(family).push([Number(shade), value]);
}

const lines = [
  "// Generated from the official Tailwind CSS theme. Do not hand-edit values.",
  `// Source: tailwindcss@${version}/theme.css (MIT)`,
  "// Regenerate with: node scripts/generate-tailwind-v4.mjs",
  "",
  `export const TAILWIND_V4_VERSION = "${version}";`,
  'export const TAILWIND_V4_SOURCE = "https://tailwindcss.com/docs/colors";',
  "",
  "export const TAILWIND_SHADES = [",
  "  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,",
  "] as const;",
  "",
  "export type TailwindShade = (typeof TAILWIND_SHADES)[number];",
  "",
  "export interface TailwindColorFamily {",
  "  readonly name: string;",
  "  readonly shades: Readonly<Record<TailwindShade, string>>;",
  "}",
  "",
  "export const TAILWIND_V4_FAMILIES = [",
];

for (const [family, shades] of families) {
  lines.push("  {");
  lines.push(`    name: "${family}",`);
  lines.push("    shades: {");
  for (const [shade, value] of shades) {
    lines.push(`      ${shade}: "${value}",`);
  }
  lines.push("    },");
  lines.push("  },");
}

lines.push("] as const satisfies readonly TailwindColorFamily[];");
lines.push("");

writeFileSync(
  new URL("../src/lib/colors/tailwind-v4.ts", import.meta.url),
  lines.join("\n"),
);

console.log(
  `Wrote ${families.size} families / ${[...families.values()].reduce(
    (total, shades) => total + shades.length,
    0,
  )} shades from tailwindcss@${version}.`,
);
