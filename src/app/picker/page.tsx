"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import ModelGrid from "@/components/ModelGrid";
import { useActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { convertAll } from "@/lib/color";

const DEFAULT_COLOR = "#1a2b3c";

export default function PickerPage() {
	const [color, setColor] = useState(DEFAULT_COLOR);
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
					aria-label="Pick color from screen"
				>
					Eyedropper
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={copyAll}
					aria-label="Copy all color values"
				>
					Copy all
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={clear}
					aria-label="Reset to default color"
				>
					Clear
				</Button>
			</>,
		);
		return () => setContent(null);
	}, [setContent, eyedropper, copyAll, clear]);

	return (
		<section className="h-full w-full max-w-5xl m-auto flex flex-col p-4 gap-6 overflow-auto justify-center items-center">
			<HexAlphaColorPicker
				color={color}
				onChange={setColor}
				style={{ width: "100%", maxWidth: 512, height: 320 }}
			/>

			<HexColorInput
				color={color}
				onChange={setColor}
				prefixed
				alpha
				className="w-full max-w-64 bg-transparent border border-border rounded-sm px-3 py-1.5 font-mono text-sm text-foreground text-center outline-none focus:border-ring transition-colors"
			/>

			<ModelGrid value={color} model="hex" />
		</section>
	);
}
