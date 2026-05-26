"use client";

import { useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { sileo } from "sileo";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { convertAll } from "@/lib/color";
import { downloadConvertCard } from "@/lib/export-image";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MODELS = ["hex", "rgb", "hsl", "oklch", "oklab", "lch"] as const;

export default function ConvertPreviewDialog({
	open,
	onOpenChangeAction,
	color,
	aModel,
	aValue,
	bModel,
	bValue,
}: {
	open: boolean;
	onOpenChangeAction: (open: boolean) => void;
	color: string;
	aModel: string;
	aValue: string;
	bModel: string;
	bValue: string;
}) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const values = useMemo(() => convertAll(color, "hex"), [color]);
	const otherModels = useMemo(
		() => MODELS.filter((m) => m !== aModel && m !== bModel),
		[aModel, bModel],
	);

	const handleDownload = useCallback(async () => {
		try {
			await downloadConvertCard(color, aModel, aValue, bModel, bValue, values, undefined, "/convert");
			sileo.success({
				title: "Image downloaded",
				icon: <DownloadSimpleIcon size={16} />,
			});
		} catch {
			sileo.error({ title: "Download failed" });
		}
	}, [color, aModel, aValue, bModel, bValue, values]);

	return (
		<Dialog open={open} onOpenChange={onOpenChangeAction}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Download conversion</DialogTitle>
				</DialogHeader>

				<div className="flex justify-center rounded-sm overflow-hidden py-4">
					<div
						className={`p-4 w-full max-w-64 ${isDark ? "bg-[#18181b]" : "bg-white ring-1 ring-border"}`}
					>
						<div
							className="w-full aspect-square rounded-sm"
							style={{ background: color }}
						/>

						<div className="mt-2 font-mono text-[10px] leading-relaxed">
							<p className="flex gap-2">
								<span className={`font-semibold w-12 shrink-0 uppercase ${isDark ? "text-white" : "text-zinc-900"}`}>{aModel}</span>
								<span className={`flex-1 truncate font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>
									{aValue}
								</span>
							</p>
							<p className="flex gap-2">
								<span className={`font-semibold w-12 shrink-0 uppercase ${isDark ? "text-white" : "text-zinc-900"}`}>{bModel}</span>
								<span className={`flex-1 truncate font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>
									{bValue}
								</span>
							</p>
						</div>

						<div className="my-2 h-px bg-zinc-800" />

						<div
							className={`font-mono text-[9px] leading-relaxed ${isDark ? "text-white" : "text-zinc-900"}`}
						>
							{otherModels.map((model) => (
								<p key={model} className="flex gap-2">
									<span className="text-zinc-500 w-12 shrink-0">{model}</span>
									<span className="flex-1 truncate text-right">{values[model] ?? "\u2014"}</span>
								</p>
							))}
						</div>

						<p className="mt-3 font-mono text-[8px] text-zinc-600 text-left">
							bicolor.harv.computer/convert
						</p>
					</div>
				</div>

				<div className="flex items-center justify-center gap-2">
					<Button variant="outline" size="sm" onClick={handleDownload}>
						<DownloadSimpleIcon />
						Download
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
