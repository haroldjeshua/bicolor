"use client";

import { useCallback } from "react";
import Link from "next/link";
import { sileo } from "sileo";
import {
	ArrowUpRightIcon,
	CopySimpleIcon,
	TextAaIcon,
} from "@phosphor-icons/react";
import { lightnessOf, type NamedColor } from "@/lib/colors";

interface ColorNameSwatchProps {
	color: NamedColor;
	label?: string;
	compact?: boolean;
	onSelect?: (color: NamedColor) => void;
}

/** Text drawn on the chip flips to dark ink above this perceived lightness. */
const INK_THRESHOLD = 0.65;

export default function ColorNameSwatch({
	color,
	label,
	compact = false,
	onSelect,
}: ColorNameSwatchProps) {
	const displayLabel = label ?? color.name;
	const ink = lightnessOf(color.hex) > INK_THRESHOLD ? "#0a0a0a" : "#ffffff";

	const copy = useCallback(
		async (value: string, kind: "name" | "HEX") => {
			try {
				await navigator.clipboard.writeText(value);
				sileo.success({
					title: `Copied ${kind}`,
					icon: <CopySimpleIcon size={16} />,
					description: (
						<span className="flex items-center gap-2">
							<span
								className="inline-block size-4 shrink-0 rounded-sm border border-border"
								style={{ background: color.hex }}
							/>
							{value}
						</span>
					),
				});
			} catch {}
		},
		[color.hex],
	);

	return (
		<div
			className={`group min-w-0 ${
				compact
					? ""
					: "[content-visibility:auto] [contain-intrinsic-size:auto_96px]"
			}`}
		>
			<div
				className={`relative overflow-hidden border border-border/40 focus-within:ring-1 focus-within:ring-ring ${
					compact ? "h-16" : "h-24"
				}`}
				style={{ background: color.hex }}
			>
				<button
					type="button"
					onClick={() => (onSelect ? onSelect(color) : copy(color.hex, "HEX"))}
					className="absolute inset-0 z-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
					title={
						onSelect
							? `Inspect ${color.name}${color.oklch ? ` · ${color.oklch}` : ""}`
							: `Copy ${color.hex}${color.oklch ? ` · ${color.oklch}` : ""}`
					}
					aria-label={
						onSelect
							? `Inspect ${color.name}`
							: `Copy HEX ${color.hex} for ${color.name}`
					}
				/>

				<div
					className="pointer-events-none absolute inset-0 z-[1] flex flex-col justify-end gap-0.5 p-2"
					style={{ color: ink }}
					aria-hidden
				>
					<span
						className={`truncate font-mono leading-tight ${
							compact ? "text-[10px]" : "text-[11px]"
						}`}
					>
						{displayLabel}
					</span>
					<span
						className={`truncate font-mono leading-tight opacity-70 ${
							compact ? "text-[9px]" : "text-[10px]"
						}`}
					>
						{color.hex}
					</span>
				</div>

				<div className="absolute right-1 top-1 z-[2] flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
					<button
						type="button"
						onClick={() => copy(color.name, "name")}
						className="flex size-5 cursor-pointer items-center justify-center border border-border/60 bg-background/85 text-foreground transition-colors hover:bg-background"
						title={`Copy name ${color.name}`}
						aria-label={`Copy color name ${color.name}`}
					>
						<TextAaIcon size={11} aria-hidden />
					</button>
					<Link
						href={`/picker?color=${encodeURIComponent(color.hex)}`}
						className="flex size-5 items-center justify-center border border-border/60 bg-background/85 text-foreground transition-colors hover:bg-background"
						title={`Open ${color.name} in picker`}
						aria-label={`Open ${color.name} in picker`}
					>
						<ArrowUpRightIcon size={11} aria-hidden />
					</Link>
				</div>
			</div>
		</div>
	);
}
