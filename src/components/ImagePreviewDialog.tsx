"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sileo } from "sileo";
import { DownloadSimpleIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { convertAll } from "@/lib/color";
import { downloadColorCard, shareColorCard, formatColorLines } from "@/lib/export-image";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ImagePreviewDialog({
	open,
	onOpenChange,
	color,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	color: string;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [rendered, setRendered] = useState(false);
	const values = useMemo(() => convertAll(color, "hex"), [color]);

	useEffect(() => {
		if (!open) {
			setRendered(false);
			return;
		}
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = 2;
		const swatchSize = 200;
		const lineHeight = 14;
		const fontSize = 9;
		const padding = 16;
		const lines = formatColorLines(color, values);
		const textHeight = lines.length * lineHeight + 6;
		const labelH = 12;

		const w = swatchSize + padding * 2;
		const h = swatchSize + labelH + textHeight + padding * 2;

		canvas.width = w * dpr;
		canvas.height = h * dpr;
		canvas.style.width = `${w}px`;
		canvas.style.height = `${h}px`;
		ctx.scale(dpr, dpr);

		ctx.fillStyle = "#18181b";
		ctx.fillRect(0, 0, w, h);

		ctx.fillStyle = color;
		ctx.fillRect(padding, padding, swatchSize, swatchSize);

		ctx.fillStyle = "#a1a1aa";
		ctx.font = `500 ${fontSize}px "Geist Mono", "SF Mono", "Cascadia Code", "Consolas", monospace`;
		ctx.textBaseline = "top";
		ctx.fillText(values.hex ?? "", padding, padding + swatchSize + 2);

		ctx.fillStyle = "#ffffff";
		let textY = padding + swatchSize + labelH + 4;
		for (const line of lines) {
			ctx.fillText(line, padding, textY);
			textY += lineHeight;
		}

		setRendered(true);
	}, [open, color, values]);

	const handleDownload = useCallback(async () => {
		try {
			await downloadColorCard(color, values);
			sileo.success({ title: "Image downloaded" });
		} catch {
			sileo.error({ title: "Download failed" });
		}
	}, [color, values]);

	const handleShare = useCallback(async () => {
		try {
			const shared = await shareColorCard(color, values);
			if (shared) sileo.success({ title: "Shared" });
		} catch {}
	}, [color, values]);

	const supportsShare = typeof navigator !== "undefined" && "share" in navigator;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Download image</DialogTitle>
				</DialogHeader>

				<div className="flex justify-center bg-zinc-900 rounded-sm p-4">
					<canvas ref={canvasRef} className="max-w-full h-auto" />
				</div>

				<div className="flex items-center gap-2 justify-end">
					<Button
						variant="outline"
						size="sm"
						onClick={handleDownload}
						disabled={!rendered}
					>
						<DownloadSimpleIcon />
						Download
					</Button>
					{supportsShare && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleShare}
							disabled={!rendered}
						>
							<ShareNetworkIcon />
							Share
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
