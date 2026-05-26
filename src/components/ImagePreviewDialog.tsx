"use client";

import { useCallback, useMemo } from "react";
import { sileo } from "sileo";
import { DownloadSimpleIcon, ShareNetworkIcon } from "@phosphor-icons/react";
import { convertAll } from "@/lib/color";
import { downloadColorCard, shareColorCard } from "@/lib/export-image";
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
	const values = useMemo(() => convertAll(color, "hex"), [color]);

	const lines = useMemo(() => {
		if (!values.hex) return [];
		return [
			`rgb: ${values.rgb ?? "\u2014"}`,
			`hsl: ${values.hsl ?? "\u2014"}`,
			`oklch: ${values.oklch ?? "\u2014"}`,
			`oklab: ${values.oklab ?? "\u2014"}`,
			`lch: ${values.lch ?? "\u2014"}`,
		];
	}, [values]);

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
			await shareColorCard(color, values);
			sileo.success({ title: "Shared" });
		} catch {}
	}, [color, values]);

	const supportsShare = typeof navigator !== "undefined" && "share" in navigator;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Download as image</DialogTitle>
				</DialogHeader>

				<div className="flex justify-center rounded-sm overflow-hidden">
					<div className="bg-[#18181b] p-4 w-full max-w-[232px]">
						<div
							className="w-full aspect-square"
							style={{ background: color }}
						/>
						<p className="mt-1 font-mono text-[9px] text-zinc-400 leading-none">
							{values.hex}
						</p>
						<div className="mt-0.5 font-mono text-[9px] text-white leading-relaxed">
							{lines.map((line) => (
								<p key={line}>{line}</p>
							))}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2 justify-end">
					<Button variant="outline" size="sm" onClick={handleDownload}>
						<DownloadSimpleIcon />
						Download
					</Button>
					{supportsShare && (
						<Button variant="outline" size="sm" onClick={handleShare}>
							<ShareNetworkIcon />
							Share
						</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
