"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import ModelGrid from "@/components/ModelGrid";
import { useActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { GamutBadge } from "@/components/GamutBadge";
import {
	Eyedropper,
	CopySimple,
	ArrowCounterClockwise,
} from "@phosphor-icons/react";
import { convertAll } from "@/lib/color";

const DEFAULT_COLOR = "#1a2b3c";

function PickerContent() {
	const searchParams = useSearchParams();
	const [color, setColor] = useState(() => {
		const param = searchParams.get("color");
		if (param && /^#[0-9a-f]{6}/i.test(param)) return param;
		return DEFAULT_COLOR;
	});
	const { setContent } = useActionBar();

	const colorRef = useRef(color);
	useEffect(() => {
		colorRef.current = color;
	}, [color]);

	const copyAll = useCallback(async () => {
		const c = colorRef.current;
		const values = convertAll(c, "hex");
		const lines = [
			`hex: ${values.hex ?? "\u2014"}`,
			`rgb: ${values.rgb ?? "\u2014"}`,
			`hsl: ${values.hsl ?? "\u2014"}`,
			`oklch: ${values.oklch ?? "\u2014"}`,
			`oklab: ${values.oklab ?? "\u2014"}`,
			`lch: ${values.lch ?? "\u2014"}`,
		];
		try {
			await navigator.clipboard.writeText(lines.join("\n"));
		} catch {}
	}, []);

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
					<Eyedropper size={14} />
					<span className="hidden md:inline">Pick</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={copyAll}
					className="text-background/60 hover:text-muted"
					aria-label="Copy all color values"
				>
					<CopySimple size={14} />
					<span className="hidden md:inline">Copy all</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={clear}
					className="text-background/60 hover:text-muted"
					aria-label="Reset to default color"
				>
					<ArrowCounterClockwise size={14} />
					<span className="hidden md:inline">Reset</span>
				</Button>
			</>,
		);
		return () => setContent(null);
	}, [setContent, eyedropper, copyAll, clear]);

	return (
		<section className="min-h-[calc(100dvh-88px)] h-full w-full max-w-5xl m-auto flex flex-col p-4 gap-6 overflow-auto justify-center items-center">
			<div style={{ width: "100%", maxWidth: 512 }}>
				<HexAlphaColorPicker
					color={color}
					onChange={setColor}
					style={{ width: "100%", height: "min(320px, 50vw)" }}
				/>
			</div>

			<div className="flex items-center gap-2">
				<HexColorInput
					color={color}
					onChange={setColor}
					prefixed
					alpha
					className="w-full max-w-48 bg-transparent border border-border rounded-sm px-3 py-1.5 font-mono text-sm text-foreground text-center outline-none focus:border-ring transition-colors"
				/>
				<GamutBadge value={color} />
			</div>

			<ModelGrid value={color} model="hex" />
		</section>
	);
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
