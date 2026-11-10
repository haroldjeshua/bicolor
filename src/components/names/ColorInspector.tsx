"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CopySimpleIcon, DownloadSimpleIcon, XIcon } from "@phosphor-icons/react";
import { sileo } from "sileo";
import ExportDialog from "@/components/ExportDialog";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import { COLLECTION_COUNTS, lightnessOf, type NamedColor } from "@/lib/colors";

interface ColorInspectorProps {
	color: NamedColor;
	collectionName: string;
	source: string;
	onClose: () => void;
}

const INK_THRESHOLD = 0.65;

/**
 * Floating, non-modal inspector for a swatch. No dimmed overlay: the page and
 * the ActionBar stay interactive at the same z-layer while this is open.
 */
export default function ColorInspector({
	color,
	collectionName,
	source,
	onClose,
}: ColorInspectorProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const [copyOpen, setCopyOpen] = useState(false);
	const [downloadOpen, setDownloadOpen] = useState(false);

	const ink = lightnessOf(color.hex) > INK_THRESHOLD ? "#0a0a0a" : "#ffffff";

	// Escape closes; focus lands on the close button, returns to the trigger on unmount.
	useEffect(() => {
		const previousFocus = document.activeElement as HTMLElement | null;
		closeRef.current?.focus();

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;

			// A nested Radix dialog (copy / download / save) closes first;
			// only dismiss the inspector when it is the only dialog open.
			if (document.querySelectorAll('[role="dialog"]').length > 1) return;

			onClose();
		};
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("keydown", onKeyDown);
			previousFocus?.focus();
		};
	}, [color.id, onClose]);

	const copyHex = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(color.hex);
			sileo.success({
				title: "Copied HEX",
				description: color.hex,
			});
		} catch {}
	}, [color.hex]);

	return (
		<>
			<div
				ref={panelRef}
				role="dialog"
				aria-label={`${color.name} inspector`}
				aria-modal="false"
				className="fixed left-1/2 top-1/2 z-40 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 border border-border bg-popover shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.06)] ring-1 ring-foreground/10"
			>
				{/* Paint-chip header, same idiom as the swatches */}
				<div
					className="relative flex h-20 flex-col justify-end gap-0.5 p-3"
					style={{ background: color.hex, color: ink }}
				>
					<span className="truncate font-mono text-sm leading-tight">
						{color.name}
					</span>
					<span className="flex items-center gap-1.5 font-mono text-[10px] leading-tight opacity-80">
						{color.hex}
						<button
							type="button"
							onClick={copyHex}
							className="cursor-pointer rounded-sm p-0.5 transition-opacity hover:opacity-70"
							aria-label={`Copy HEX ${color.hex}`}
						>
							<CopySimpleIcon size={10} aria-hidden />
						</button>
					</span>
				</div>

				<div className="flex flex-col gap-3 p-3">
					<div className="flex items-center justify-between gap-2">
						<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
							{collectionName}
						</span>
						<span className="font-mono text-[10px] text-muted-foreground/60">
							{source} · {COLLECTION_COUNTS[color.collection]} colors
						</span>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<button
							type="button"
							onClick={() => setCopyOpen(true)}
							className="flex h-9 cursor-pointer items-center justify-center gap-1.5 border border-border bg-muted/20 font-mono text-[11px] text-foreground transition-colors hover:bg-muted/40"
						>
							<CopySimpleIcon size={14} aria-hidden />
							Copy color
						</button>
						<button
							type="button"
							onClick={() => setDownloadOpen(true)}
							className="flex h-9 cursor-pointer items-center justify-center gap-1.5 border border-border bg-muted/20 font-mono text-[11px] text-foreground transition-colors hover:bg-muted/40"
						>
							<DownloadSimpleIcon size={14} aria-hidden />
							Download
						</button>
					</div>
				</div>

				<button
					type="button"
					ref={closeRef}
					onClick={onClose}
					className="absolute right-1.5 top-1.5 flex size-6 cursor-pointer items-center justify-center border border-background/40 transition-colors"
					style={{ background: color.hex, color: ink }}
					aria-label="Close inspector"
				>
					<XIcon size={12} aria-hidden />
				</button>
			</div>

			<ExportDialog open={copyOpen} onOpenChangeAction={setCopyOpen} color={color.hex} />
			<ImagePreviewDialog open={downloadOpen} onOpenChangeAction={setDownloadOpen} color={color.hex} />
		</>
	);
}
