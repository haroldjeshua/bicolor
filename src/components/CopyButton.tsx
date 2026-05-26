"use client";

import { useCallback } from "react";
import { sileo } from "sileo";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export default function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      sileo.success({ title: "Copied" });
    } catch {}
  }, [value]);

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
