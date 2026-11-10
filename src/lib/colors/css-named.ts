import { HTML_COLOR_NAMES } from "@/lib/constants";
import type { NamedColor } from "./types";

/**
 * CSS named colors, expanded from the existing keyword lookup.
 *
 * Aliases (aqua/cyan, gray/grey, etc.) are intentionally preserved as separate
 * entries. The names and values mirror CSS Color Module Level 4.
 */
export const CSS_NAMED_COLORS: readonly NamedColor[] = Object.entries(
  HTML_COLOR_NAMES,
).map(([name, hex]) => ({
  id: `css:${name}`,
  name,
  hex: hex.toLowerCase(),
  collection: "css" as const,
}));
