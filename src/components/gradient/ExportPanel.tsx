"use client";

import { useEffect, useState } from "react";
import { sileo } from "sileo";
import { CopySimpleIcon, ExportIcon, XIcon } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface ExportPanelProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	gradientCSS: string;
	gradientTW: string;
}

/**
 * Export surface anchored to the ActionBar so the side panel stays devoted to
 * controls. Holds the CSS / Tailwind code block and the copy action.
 */
export default function ExportPanel({
	open,
	onOpenChange,
	gradientCSS,
	gradientTW,
}: ExportPanelProps) {
	const [tab, setTab] = useState("css");

	useEffect(() => {
		if (!open) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onOpenChange(false);
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open, onOpenChange]);

	if (!open) return null;

	const text =
		tab === "css" ? `background: ${gradientCSS};` : gradientTW;

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			sileo.success({
				title: tab === "css" ? "CSS copied" : "Tailwind class copied",
			});
		} catch {
			// clipboard blocked; the code block stays selectable
		}
	};

	return (
		<>
			{/* outside click closes */}
			<div
				className="fixed inset-0 z-40"
				onPointerDown={() => onOpenChange(false)}
				aria-hidden
			/>

			<div
				role="dialog"
				aria-label="Export gradient"
				className="fixed bottom-14 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 border border-border bg-background shadow-xl"
			>
				<div className="flex items-center justify-between px-4 pt-3">
					<span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
						<ExportIcon size={12} aria-hidden />
						Export
					</span>
					<div className="flex items-center gap-1">
						<Button variant="bare" size="xs" onClick={copy} aria-label="Copy code">
							<CopySimpleIcon size={12} aria-hidden />
							Copy
						</Button>
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="flex size-6 cursor-pointer items-center justify-center text-muted-foreground/60 transition-colors hover:text-foreground"
							aria-label="Close export"
						>
							<XIcon size={14} aria-hidden />
						</button>
					</div>
				</div>

				<Tabs value={tab} onValueChange={setTab} className="w-full px-4 pt-2 pb-4">
					<TabsList variant="line" className="mb-2">
						<TabsTrigger value="css">CSS</TabsTrigger>
						<TabsTrigger value="tw">Tailwind</TabsTrigger>
					</TabsList>
					<TabsContent value="css">
						<pre className="max-h-32 overflow-y-auto border border-border/70 bg-muted/30 p-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap text-muted-foreground select-all">
							{"background: "}
							{gradientCSS}
						</pre>
					</TabsContent>
					<TabsContent value="tw">
						<pre className="max-h-32 overflow-y-auto border border-border/70 bg-muted/30 p-2 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap text-muted-foreground select-all">
							{gradientTW}
						</pre>
					</TabsContent>
				</Tabs>
			</div>
		</>
	);
}
