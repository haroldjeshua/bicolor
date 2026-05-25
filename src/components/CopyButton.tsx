"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export default function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // silently fail
    }
  }, [value]);

  if (copied) {
    return (
      <span className="w-16 text-xs font-mono text-success pointer-events-none select-none text-right">
        Copied ✓
      </span>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="w-16 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors text-right cursor-pointer"
      aria-label={`Copy ${value}`}
    >
      {label}
    </button>
  );
}
