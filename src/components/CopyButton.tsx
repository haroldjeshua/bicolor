"use client";

import { useCallback, useEffect, useState } from "react";

interface CopyButtonProps {
	value: string;
	label?: string;
}

export default function CopyButton({ value, label = "Copy" }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const id = setTimeout(() => setCopied(false), 1500);
		return () => clearTimeout(id);
	}, [copied]);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
		} catch {}
	}, [value]);

	return (
		<button
			onClick={handleCopy}
			className="w-16 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors text-right cursor-pointer"
			aria-label={`Copy ${value}`}
		>
			{copied ? "Copied ✓" : label}
		</button>
	);
}
