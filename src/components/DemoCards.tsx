"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HexColorPicker } from "react-colorful";
import ColorSwatch from "@/components/ColorSwatch";
import { generatePalette } from "@/lib/color";
import { convert } from "@/lib/color";
import { MODELS, MODEL_LABELS, type ColorModel } from "@/lib/constants";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ArrowRightIcon } from "@phosphor-icons/react";

const DEMO_HEX = "#6366f1";

function blendWithWhite(hex: string, amount: number) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	const nr = Math.round(r + (255 - r) * amount);
	const ng = Math.round(g + (255 - g) * amount);
	const nb = Math.round(b + (255 - b) * amount);
	return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

function SectionLink({
	href,
	label,
	color,
}: {
	href: string;
	label: string;
	color: string;
}) {
	const params = new URLSearchParams();
	if (label === "Pick") {
		params.set("color", color);
	} else if (label === "Convert") {
		params.set("from", "hex");
		params.set("value", color);
		params.set("to", "oklch");
	} else {
		params.set("seed", color);
	}
	return (
		<Link
			href={`${href}?${params.toString()}`}
			className="group inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted-foreground/60 hover:text-foreground transition-colors"
		>
			{label}
			<ArrowRightIcon
				size={10}
				className="transition-transform group-hover:translate-x-0.5"
			/>
		</Link>
	);
}

function PickerDemo({
	color,
	onChange,
}: {
	color: string;
	onChange: (c: string) => void;
}) {
	const oklch = convert(color, "hex", "oklch");

	return (
		<div className="flex flex-col items-center gap-2 w-full max-w-50">
			<HexColorPicker
				color={color}
				onChange={onChange}
				style={{ width: "100%", height: 160 }}
			/>
			<div className="flex items-center gap-1.5 font-mono text-xs">
				<ColorSwatch color={color} size="sm" />
				<span className="text-foreground">{color}</span>
			</div>
			<span className="font-mono text-xs text-muted-foreground truncate w-full text-center leading-tight">
				{oklch}
			</span>
		</div>
	);
}

function ConvertDemo({ color }: { color: string }) {
	const [model, setModel] = useState<ColorModel>("hex");
	const targetModel: ColorModel = model === "hex" ? "oklch" : "hex";
	const [value, setValue] = useState(() => convert(color, "hex", model) ?? color);

	useEffect(() => {
		setValue(convert(color, "hex", model) ?? color);
	}, [color, model]);

	const result = convert(value, model, targetModel);

	return (
		<div className="flex flex-col items-center gap-2 w-full max-w-64">
			<div className="flex items-center gap-0 w-full">
				<input
					type="text"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					className="flex-1 h-9 bg-transparent border border-border rounded-sm px-1.5 font-mono text-xs text-foreground outline-none focus:border-ring transition-colors"
					spellCheck={false}
					aria-label="Color value"
				/>
				<Select value={model} onValueChange={(v) => setModel(v as ColorModel)}>
					<SelectTrigger
						className="h-9 font-mono text-xs"
						aria-label="Color model"
						style={{ height: 36 }}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{MODELS.map((m) => (
							<SelectItem
								key={m}
								value={m}
								className="font-mono text-xs cursor-pointer"
							>
								{MODEL_LABELS[m]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex items-center gap-1.5 font-mono text-xs">
				<ColorSwatch color={result ?? ""} size="sm" />
				<span className="text-foreground text-[10px]">
					{result || "\u2014"}
				</span>
				<span className="text-muted-foreground">
					({MODEL_LABELS[targetModel]})
				</span>
			</div>
		</div>
	);
}

function PaletteDemo({ color }: { color: string }) {
	const { steps } = generatePalette(color);

	return (
		<div className="flex flex-col items-center gap-2 w-full max-w-56">
			<ColorSwatch color={color} size="lg" />
			{steps.length > 0 && (
				<div className="flex overflow-hidden w-full">
					{steps.map((s) => (
						<div
							key={s.index}
							className="flex-1 h-6"
							style={{ background: s.hex }}
						/>
					))}
				</div>
			)}
			<span className="font-mono text-xs text-muted-foreground">{color}</span>
		</div>
	);
}

export function DemoCards() {
	const [color, setColor] = useState(DEMO_HEX);

	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty("--logo-fill-1", color);
		root.style.setProperty("--logo-fill-2", blendWithWhite(color, 0.3));
		root.style.setProperty("--logo-fill-3", blendWithWhite(color, 0.55));
		try {
			sessionStorage.setItem("demoColor", color);
		} catch {}
	}, [color]);

	return (
		<div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
			<div className="flex flex-col items-center gap-8">
				<SectionLink href="/picker" label="Pick" color={color} />
				<PickerDemo color={color} onChange={setColor} />
			</div>
			<div className="flex flex-col items-center gap-8">
				<SectionLink href="/convert" label="Convert" color={color} />
				<ConvertDemo color={color} />
			</div>
			<div className="flex flex-col items-center gap-8">
				<SectionLink href="/palette" label="Palette" color={color} />
				<PaletteDemo color={color} />
			</div>
		</div>
	);
}
