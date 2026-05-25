"use client";

import { isOutOfGamut } from "@/lib/gamut";

export function GamutBadge({ value }: { value: string }) {
  const out = isOutOfGamut(value);
  if (!out) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 font-mono text-[10px] tracking-wide uppercase"
      title="This color is outside the sRGB gamut and may not display accurately on standard screens"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span>Out of gamut</span>
    </span>
  );
}
