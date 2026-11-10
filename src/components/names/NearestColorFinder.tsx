"use client";

import { useMemo } from "react";
import {
	COLOR_COLLECTION_MAP,
	findNearestColors,
	type NearestColorMatch,
} from "@/lib/colors";

interface NearestColorFinderProps {
	value: string;
	onValueChange: (value: string) => void;
	onSelect: (match: NearestColorMatch) => void;
}

export default function NearestColorFinder({
	value,
	onValueChange,
	onSelect,
}: NearestColorFinderProps) {
	const trimmed = value.trim();

	const matches = useMemo(
		() => (trimmed ? findNearestColors(trimmed) : []),
		[trimmed],
	);

	const found = matches.length > 0;
	const invalid = trimmed.length > 0 && !found;

	return (
		<section
			aria-label="Nearest named color"
			className="border-b border-border/60 py-3"
		>
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-center gap-3">
					<span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
						nearest name
					</span>
					<span className="relative flex items-center">
						<span
							className={`pointer-events-none absolute left-1.5 size-4 border ${
								found ? "border-transparent" : "border-border"
							}`}
							style={found ? { background: trimmed } : undefined}
							aria-hidden
						/>
						<input
							type="text"
							value={value}
							onChange={(event) => onValueChange(event.target.value)}
							placeholder="#3b82f6"
							className="h-9 w-44 border border-border bg-transparent py-1.5 pl-7 pr-2 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ring sm:w-56"
							spellCheck={false}
							autoComplete="off"
							aria-label="Any color value to find its nearest name"
							aria-invalid={invalid}
						/>
					</span>
				</div>

				<div
					className="flex min-h-5 flex-wrap items-center gap-x-5 gap-y-1.5"
					role="status"
					aria-live="polite"
				>
					{invalid && (
						<span className="font-mono text-[11px] text-muted-foreground">
							not a color
						</span>
					)}

					{matches.map((match) => {
						const collection = COLOR_COLLECTION_MAP[match.collection];
						const exact = match.distance < 0.05;

						return (
							<button
								key={match.collection}
								type="button"
								onClick={() => onSelect(match)}
								className="group flex cursor-pointer items-center gap-1.5 font-mono text-[11px] leading-none"
								title={`Show ${match.color.name} in the grid`}
							>
								<span
									className="size-3 shrink-0 border border-border/60"
									style={{ background: match.color.hex }}
									aria-hidden
								/>
								<span className="uppercase tracking-wide text-muted-foreground/70">
									{collection.shortName}
								</span>
								<span className="text-foreground/90 group-hover:text-foreground group-hover:underline group-hover:underline-offset-2">
									{match.color.name}
								</span>
								<span className="tabular-nums text-[10px] text-muted-foreground/50">
									{exact ? "exact" : `\u0394E ${match.distance.toFixed(1)}`}
								</span>
							</button>
						);
					})}
				</div>
			</div>
		</section>
	);
}
