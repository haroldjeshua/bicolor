"use client";

import {
	MODELS,
	MODEL_LABELS,
	MODEL_DESCRIPTIONS,
	type ColorModel,
} from "@/lib/constants";
import { convertAll, findClosestNamedColor } from "@/lib/color";
import CopyButton from "./CopyButton";
import { InfoIcon } from "@phosphor-icons/react";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";

interface ModelGridProps {
	value: string;
	model: ColorModel;
}

export default function ModelGrid({ value, model }: ModelGridProps) {
	const values = convertAll(value, model);
	const namedColor = value ? findClosestNamedColor(values.hex ?? "") : null;

	return (
		<div className="flex flex-col gap-px font-mono text-xs min-w-lg">
			{MODELS.map((m) => {
				const v = values[m];
				return (
					<div
						key={m}
						className={`flex items-center gap-3 px-3 py-1.5 rounded-sm transition-opacity ${
							v ? "text-foreground" : "text-muted-foreground/40"
						}`}
					>
						<span
							className="w-12 shrink-0 text-muted-foreground uppercase"
							title={MODEL_DESCRIPTIONS[m]}
							aria-label={MODEL_DESCRIPTIONS[m]}
						>
							{MODEL_LABELS[m]}
						</span>
						<span className="flex-1 truncate tracking-tight">
							{v ?? "\u2014"}
						</span>
						{v && <CopyButton value={v} />}
					</div>
				);
			})}
			<div className="flex items-center gap-3 px-3 py-1.5 rounded-sm text-muted-foreground">
				<span className="w-12 shrink-0 uppercase">Named</span>
				<span className="flex-1 truncate capitalize">
					{namedColor?.name ?? "\u2014"}
				</span>

				<Popover>
					<PopoverTrigger asChild>
						<button
							className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
							aria-label="About named colors"
						>
							<InfoIcon size={12} />
						</button>
					</PopoverTrigger>
					<PopoverContent side="top" align="end" className="font-mono">
						<PopoverTitle>Nearest named color</PopoverTitle>
						<PopoverDescription>
							This is the closest X11/CSS named color matched by RGB distance.
							It is not the exact color name &mdash; most hex values don&apos;t
							have a corresponding named equivalent.
						</PopoverDescription>
					</PopoverContent>
				</Popover>
				<span className="text-xs font-mono text-muted-foreground/50">
					{namedColor?.hex ?? ""}
				</span>
			</div>
		</div>
	);
}
