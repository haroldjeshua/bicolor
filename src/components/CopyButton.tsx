"use client";

import { useCallback } from "react";
import { sileo } from "sileo";
import { CopySimpleIcon } from "@phosphor-icons/react";

interface CopyButtonProps {
  value: string;
  label?: string;
}

export default function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      sileo.success({ title: "Copied", icon: <CopySimpleIcon size={16} /> });
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
