"use client";

import { useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
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
	onOpenChangeAction,
	color,
}: {
	open: boolean;
	onOpenChangeAction: (open: boolean) => void;
	color: string;
}) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
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
			sileo.success({
				title: "Image downloaded",
				icon: <DownloadSimpleIcon size={16} />,
				description: (
					<span className="flex items-center gap-2">
						<span
							className="inline-block size-4 shrink-0 rounded-sm"
							style={{ background: color }}
						/>
						{values.hex}
					</span>
				),
			});
		} catch {
			sileo.error({ title: "Download failed" });
		}
	}, [color, values]);

	const handleShare = useCallback(async () => {
		try {
			await shareColorCard(color, values);
			sileo.success({
				title: "Shared",
				icon: <ShareNetworkIcon size={16} />,
				description: (
					<span className="flex items-center gap-2">
						<span
							className="inline-block size-4 shrink-0 rounded-sm"
							style={{ background: color }}
						/>
						{values.hex}
					</span>
				),
			});
		} catch {}
	}, [color, values]);

	const supportsShare =
		typeof navigator !== "undefined" && "share" in navigator;

	return (
		<Dialog open={open} onOpenChange={onOpenChangeAction}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Download as image</DialogTitle>
				</DialogHeader>

				<div className="flex justify-center rounded-sm overflow-hidden py-4">
					<div
						className={`p-4 w-full max-w-58 ${isDark ? "bg-[#18181b]" : "bg-white ring-1 ring-border"}`}
					>
						<div
							className="w-full aspect-square"
							style={{ background: color }}
						/>
						<p
							className={`mt-1 font-mono text-[9px] leading-none ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
						>
							{values.hex}
						</p>
						<div
							className={`mt-0.5 font-mono text-[9px] leading-relaxed ${isDark ? "text-white" : "text-zinc-900"}`}
						>
							{lines.map((line) => (
								<p key={line}>{line}</p>
							))}
						</div>
					</div>
				</div>

				<div className="flex items-center justify-center gap-2">
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
