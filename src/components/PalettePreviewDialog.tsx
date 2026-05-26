"use client";

import { useCallback, useState } from "react";
import { useTheme } from "next-themes";
import { sileo } from "sileo";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { downloadPaletteCard } from "@/lib/export-image";
import type { PaletteStep } from "@/lib/color";
import type { ColorModel } from "@/lib/constants";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAILWIND_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export default function PalettePreviewDialog({
	open,
	onOpenChangeAction,
	steps,
	seedStep,
	displayModel,
}: {
	open: boolean;
	onOpenChangeAction: (open: boolean) => void;
	steps: PaletteStep[];
	seedStep: number;
	displayModel: ColorModel;
}) {
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
		"horizontal",
	);

	const seed = steps.find((s) => s.index === seedStep);
	const seedValue = seed
		? ((seed[displayModel as keyof PaletteStep] as string) ?? "")
		: "";

	const handleDownload = useCallback(async () => {
		try {
			await downloadPaletteCard(
				steps,
				seedStep,
				displayModel,
				undefined,
				"/palette",
				orientation,
			);
			sileo.success({
				title: "Image downloaded",
				icon: <DownloadSimpleIcon size={16} />,
			});
		} catch {
			sileo.error({ title: "Download failed" });
		}
	}, [steps, seedStep, displayModel, orientation]);

	return (
		<Dialog open={open} onOpenChange={onOpenChangeAction}>
			<DialogContent className="sm:max-w-175 max-h-[85dvh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Download palette</DialogTitle>
				</DialogHeader>

				<Tabs
					value={orientation}
					onValueChange={(v) => setOrientation(v as "horizontal" | "vertical")}
					className="flex justify-center"
				>
					<TabsList variant="line">
						<TabsTrigger value="horizontal">Horizontal</TabsTrigger>
						<TabsTrigger value="vertical">Vertical</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="flex justify-center rounded-sm overflow-hidden py-6">
					<div
						className={`p-6 w-full ${orientation === "vertical" ? "max-w-80" : "max-w-165"} ${isDark ? "bg-[#18181b]" : "bg-white ring-1 ring-border"}`}
					>
						<p className={`font-mono text-sm font-bold ${isDark ? "text-white" : "text-zinc-900"}`}>
							bicolor · palette
						</p>

						{orientation === "horizontal" ? (
							<>
								<div className="mt-4 flex gap-1.2">
									{steps.map((s) => (
										<div
											key={s.index}
											className="relative flex-1 aspect-square"
											style={{ background: s.hex }}
										>
											{s.index === seedStep && (
												<div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-white/70" />
											)}
										</div>
									))}
								</div>

								<div className="mt-2 flex gap-1.2 font-mono text-[11px]">
									{TAILWIND_STEPS.map((tw, i) => (
										<span
											key={steps[i]?.index ?? i}
											className={`flex-1 text-center ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
										>
											{tw}
										</span>
									))}
								</div>

								<p className={`mt-5 font-mono text-[13px] font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
									{seedValue}
								</p>

								<div className="my-3 h-px bg-zinc-800" />

								<div
									className={`font-mono text-[11px] leading-6 ${isDark ? "text-white" : "text-zinc-900"}`}
								>
									{steps.map((s, i) => {
										const val = (s[displayModel as keyof PaletteStep] as string) ?? "";
										return (
											<p key={s.index} className="flex gap-3">
												<span className="text-zinc-500 w-10 shrink-0">{TAILWIND_STEPS[i]}</span>
												<span className="flex-1 truncate">{val}</span>
											</p>
										);
									})}
								</div>
							</>
						) : (
							<>
							<div className="mt-4 font-mono text-[11px]">
								{steps.map((s, i) => {
									const val = (s[displayModel as keyof PaletteStep] as string) ?? "";
									return (
										<div key={s.index} className="flex items-center gap-3 h-6 mb-1.5">
											<span
												className="inline-block size-6 shrink-0 rounded-sm"
												style={{ background: s.hex }}
											/>
											<span className={`font-semibold w-10 ${isDark ? "text-white" : "text-zinc-900"}`}>{TAILWIND_STEPS[i]}</span>
											<span className="flex-1 truncate">{val}</span>
										</div>
									);
								})}
							</div>

								<p className={`mt-4 font-mono text-[13px] font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
									{seedValue}
								</p>
							</>
						)}

						<p className="mt-4 font-mono text-[8px] text-zinc-600 text-left">
							bicolor.harv.computer/palette
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
