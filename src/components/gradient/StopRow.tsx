"use client";

import { useMemo } from "react";
import ColorSwatch from "@/components/ColorSwatch";
import { ArrowsOutLineHorizontalIcon, MinusCircleIcon } from "@phosphor-icons/react";
import { HexAlphaColorPicker } from "react-colorful";
import { convert } from "@/lib/color";
import type { ColorModel } from "@/lib/constants";
import ScrubInput from "./ScrubInput";
import type { GradientStop } from "./types";

interface StopRowProps {
	stop: GradientStop;
	index: number;
	colorModel: ColorModel;
	isPickerOpen: boolean;
	onTogglePicker: () => void;
	onClosePicker: () => void;
	onColorChange: (color: string) => void;
	onPositionChange: (position: number) => void;
	onRemove: () => void;
	canRemove: boolean;
}

export default function StopRow({
	stop,
	index,
	colorModel,
	isPickerOpen,
	onTogglePicker,
	onClosePicker,
	onColorChange,
	onPositionChange,
	onRemove,
	canRemove,
}: StopRowProps) {
	const hex = useMemo(
		() => convert(stop.color, "hex", "hex") ?? stop.color,
		[stop.color],
	);
	const displayColor = useMemo(
		() => convert(stop.color, "hex", colorModel) ?? stop.color,
		[stop.color, colorModel],
	);

	return (
		<div className="flex items-center gap-2 border border-border/60 bg-muted/15 p-1.5">
			<div className="relative shrink-0">
				<button
					type="button"
					onClick={(event) => {
						event.stopPropagation();
						onTogglePicker();
					}}
					className="flex cursor-pointer rounded-sm outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
					aria-label={`Pick color for stop ${index + 1}`}
				>
					<ColorSwatch
						color={stop.color}
						size="sm"
						className="rounded-sm border border-border/70 p-0.5"
					/>
				</button>
				{isPickerOpen && (
					<>
						<div
							className="fixed inset-0 z-40"
							onPointerUp={onClosePicker}
						/>
						<div className="absolute top-full left-0 z-50 mt-2 border border-border bg-background p-1.5 shadow-lg">
							<HexAlphaColorPicker
								color={hex}
								onChange={onColorChange}
								className="rounded-sm"
							/>
						</div>
					</>
				)}
			</div>

			<input
				type="text"
				value={displayColor}
				onChange={(event) => {
					const next = convert(event.target.value, colorModel, "hex");
					if (next) onColorChange(next);
				}}
				className="h-8 min-w-0 flex-1 border border-border/70 bg-muted/20 px-2 font-mono text-[11px] text-foreground outline-none transition-colors focus:border-ring"
				spellCheck={false}
				autoComplete="off"
				aria-label={`Color value for stop ${index + 1}`}
			/>

			<ScrubInput
				value={stop.position}
				min={0}
				max={100}
				step={1}
				fineStep={0.1}
				unitsPerPixel={0.5}
				fineUnitsPerPixel={0.05}
				onValueChange={onPositionChange}
				ariaLabel={`Stop ${index + 1} position`}
				suffix="%"
				icon={<ArrowsOutLineHorizontalIcon size={12} aria-hidden />}
				className="w-[96px] shrink-0"
			/>

			<button
				type="button"
				onClick={onRemove}
				disabled={!canRemove}
				className="flex size-7 shrink-0 cursor-pointer items-center justify-center text-muted-foreground/40 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-20"
				aria-label={`Remove stop ${index + 1}`}
			>
				<MinusCircleIcon size={16} aria-hidden />
			</button>
		</div>
	);
}
