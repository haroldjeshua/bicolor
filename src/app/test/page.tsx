import { convert } from "@/lib/color";
import type { ColorModel } from "@/lib/constants";

function runTests() {
  const results: { label: string; ok: boolean; output: string }[] = [];

  const testCases: [string, ColorModel, ColorModel, string][] = [
    ["#ff0000", "hex", "oklch", "oklch"],
    ["#ff0000", "hex", "hex", "#ff0000"],
    ["rgb(255, 0, 0)", "rgb", "hex", "#ff0000"],
    ["hsl(0, 100%, 50%)", "hsl", "rgb", "rgb(255, 0, 0)"],
    ["oklch(0.5 0.2 260)", "oklch", "hex", "#"],
  ];

  for (const [value, from, to, expectedPrefix] of testCases) {
    const result = convert(value, from, to);
    const ok = result !== null && result.startsWith(expectedPrefix);
    results.push({
      label: `${from}→${to} (${value})`,
      ok,
      output: result ?? "null",
    });
  }

  return results;
}

export default function TestPage() {
  const results = runTests();

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-lg mb-4">lib/color.ts tests</h1>
      {results.map((r, i) => (
        <div key={i} className={`mb-1 ${r.ok ? "text-success" : "text-red-500"}`}>
          {r.ok ? "✓" : "✗"} {r.label}
          <span className="text-muted-foreground ml-2">→ {r.output}</span>
        </div>
      ))}
    </div>
  );
}
