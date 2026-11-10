"use client";

import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HexAlphaColorPicker } from "react-colorful";
import { sileo } from "sileo";
import ColorInput from "@/components/ColorInput";
import ColorSwatch from "@/components/ColorSwatch";
import ModelGrid from "@/components/ModelGrid";
import SaveDialog from "@/components/SaveDialog";
import { useActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { GamutBadge } from "@/components/GamutBadge";
import ExportDialog from "@/components/ExportDialog";
import ImagePreviewDialog from "@/components/ImagePreviewDialog";
import { convert } from "@/lib/color";
import { type ColorModel } from "@/lib/constants";
import {
	EyedropperIcon,
	CopySimpleIcon,
	DownloadSimpleIcon,
	ArrowCounterClockwiseIcon,
	BookmarkSimpleIcon,
} from "@phosphor-icons/react";

const DEFAULT_COLOR = "#1a2b3c";

function PickerContent() {
	const searchParams = useSearchParams();
	const [color, setColor] = useState(() => {
		const param = searchParams.get("color");
		if (param && /^#[0-9a-f]{6}/i.test(param)) return param;
		return DEFAULT_COLOR;
	});
	const [copyOpen, setCopyOpen] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [saveOpen, setSaveOpen] = useState(false);
	const [inputModel, setInputModel] = useState<ColorModel>("hex");
	const { setContent } = useActionBar();

	const displayValue = useMemo(
		() => convert(color, "hex", inputModel) ?? color,
		[color, inputModel],
	);

	const handleValueChange = useCallback(
		(v: string) => {
			const hex = convert(v, inputModel, "hex");
			if (hex) {
				setColor(hex);
			} else if (/^#[0-9a-f]{3,8}$/i.test(v)) {
				setColor(v);
			}
		},
		[inputModel],
	);

	const clear = useCallback(() => {
		setColor(DEFAULT_COLOR);
	}, []);

	const eyedropper = useCallback(async () => {
		if (typeof window === "undefined") return;
		try {
			const EyeDropper = (
				window as unknown as {
					EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
				}
			).EyeDropper;
			if (!EyeDropper) return;
			const dropper = new EyeDropper();
			const result = await dropper.open();
			setColor(result.sRGBHex);
			sileo.success({
				title: "Picked",
				icon: <EyedropperIcon size={16} />,
				description: (
					<span className="flex items-center gap-2">
						<span
							className="inline-block size-4 shrink-0 rounded-sm border border-border"
							style={{ background: result.sRGBHex }}
						/>
						{result.sRGBHex}
					</span>
				),
			});
		} catch {
			// user cancelled or browser unsupported
		}
	}, []);

	useEffect(() => {
		setContent(
			<>
				<Button
					variant="bare"
					size="sm"
					onClick={eyedropper}
					className="text-background/60 hover:text-muted"
					aria-label="Pick color from screen"
				>
					<EyedropperIcon size={14} />
					<span className="hidden md:inline">Pick</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={() => setCopyOpen(true)}
					className="text-background/60 hover:text-muted"
					aria-label="Copy color values"
				>
					<CopySimpleIcon size={14} />
					<span className="hidden md:inline">Copy</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={() => setPreviewOpen(true)}
					className="text-background/60 hover:text-muted"
					aria-label="Download color image"
				>
					<DownloadSimpleIcon size={14} />
					<span className="hidden md:inline">Download</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={clear}
					className="text-background/60 hover:text-muted"
					aria-label="Reset to default color"
				>
					<ArrowCounterClockwiseIcon size={14} />
					<span className="hidden md:inline">Reset</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={() => setSaveOpen(true)}
					className="text-background/60 hover:text-muted"
					aria-label="Save color"
				>
					<BookmarkSimpleIcon size={14} />
					<span className="hidden md:inline">Save</span>
				</Button>
			</>,
		);
		return () => setContent(null);
	}, [setContent, eyedropper, clear, color]);

	useEffect(() => {
		syncLogoColor(color);
	}, [color]);

	return (
		<section className="min-h-[calc(100dvh-48px)] h-full w-full max-w-5xl m-auto flex flex-col p-4 pb-16 gap-6 overflow-auto justify-center items-center">
			<HexAlphaColorPicker
				color={color}
				onChange={setColor}
				style={{ width: "100%", maxWidth: 512, height: "min(320px, 50vw)" }}
			/>

			<div className="flex items-center gap-3 w-full flex-col max-w-lg">
				<div className="flex items-center gap-3 w-full flex-row">
					<ColorSwatch color={color} size="sm" />
					<ColorInput
						value={displayValue}
						model={inputModel}
						onValueChange={handleValueChange}
						onModelChange={setInputModel}
					/>
				</div>

				<GamutBadge value={color} />
			</div>

			<ModelGrid value={color} model="hex" />

			<ExportDialog
				open={copyOpen}
				onOpenChangeAction={setCopyOpen}
				color={color}
			/>
			<ImagePreviewDialog
				open={previewOpen}
				onOpenChangeAction={setPreviewOpen}
				color={color}
			/>
			<SaveDialog
				open={saveOpen}
				onOpenChange={setSaveOpen}
				type="color"
				hex={color}
				url={`/picker?color=${encodeURIComponent(color)}`}
			/>
		</section>
	);
}

function blendWithWhite(hex: string, amount: number) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	const nr = Math.round(r + (255 - r) * amount);
	const ng = Math.round(g + (255 - g) * amount);
	const nb = Math.round(b + (255 - b) * amount);
	return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

function syncLogoColor(hex: string) {
	const root = document.documentElement;
	root.style.setProperty("--logo-fill-1", hex);
	root.style.setProperty("--logo-fill-2", blendWithWhite(hex, 0.3));
	root.style.setProperty("--logo-fill-3", blendWithWhite(hex, 0.55));
	try {
		sessionStorage.setItem("demoColor", hex);
	} catch {}
}

export default function PickerPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
					Loading...
				</div>
			}
		>
			<PickerContent />
		</Suspense>
	);
}
