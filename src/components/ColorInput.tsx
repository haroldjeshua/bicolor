"use client";

import { useState, useCallback } from "react";
import { MODELS, MODEL_LABELS, MODEL_PLACEHOLDERS, type ColorModel } from "@/lib/constants";

interface ColorInputProps {
  value: string;
  model: ColorModel;
  onValueChange: (value: string) => void;
  onModelChange: (model: ColorModel) => void;
  placeholder?: string;
  readonly?: boolean;
  hideOptions?: ColorModel[];
}

export default function ColorInput({
  value,
  model,
  onValueChange,
  onModelChange,
  placeholder,
  readonly,
  hideOptions,
}: ColorInputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [value]);

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        readOnly={readonly}
        placeholder={placeholder ?? MODEL_PLACEHOLDERS[model]}
        className="flex-1 bg-transparent border border-border rounded-sm px-2 py-1.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-ring transition-colors"
        spellCheck={false}
        aria-label="Color value"
      />
      {value && (
        <button
          onClick={handleCopy}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label={copied ? "Copied" : "Copy color value"}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      )}
      <select
        value={model}
        onChange={(e) => onModelChange(e.target.value as ColorModel)}
        className="bg-transparent border border-border rounded-sm px-2 py-1.5 font-mono text-sm text-foreground outline-none focus:border-ring transition-colors cursor-pointer"
        aria-label="Color model"
      >
        {MODELS.filter((m) => m === model || !hideOptions?.includes(m)).map((m) => (
          <option key={m} value={m} className="bg-background text-foreground">
            {MODEL_LABELS[m]}
          </option>
        ))}
      </select>
    </div>
  );
}
