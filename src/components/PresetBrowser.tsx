"use client";

import { useState, useCallback } from "react";
import { sileo } from "sileo";
import { CopySimpleIcon, PaletteIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PRESETS, PRESET_CATEGORIES, type PresetPalette } from "@/lib/presets";

interface PresetBrowserProps {
	onSelectPreset: (preset: PresetPalette) => void;
}

function PresetStrip({ colors }: { colors: PresetPalette["colors"] }) {
	return (
		<div className="flex overflow-hidden rounded-sm h-6 w-full">
			{colors.map((c, i) => (
				<div
					key={`${c.label}-${i}`}
					className="flex-1"
					style={{ backgroundColor: c.hex }}
					title={`${c.label}: ${c.hex}`}
				/>
			))}
		</div>
	);
}

export default function PresetBrowser({ onSelectPreset }: PresetBrowserProps) {
	const [open, setOpen] = useState(false);
	const [activeCategory, setActiveCategory] = useState<string>(PRESET_CATEGORIES[0].id);

	const filtered = PRESETS.filter((p) => {
		const cat = PRESET_CATEGORIES.find((c) =>
			p.source.toLowerCase().includes(c.id),
		);
		return cat?.id === activeCategory;
	});

	const handleSelect = useCallback(
		(preset: PresetPalette) => {
			onSelectPreset(preset);
		},
		[onSelectPreset],
	);

	return (
		<div className="w-full max-w-2xl">
			<Button
				variant="bare"
				size="sm"
				onClick={() => setOpen((o) => !o)}
				className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors"
				aria-label="Toggle preset palettes"
			>
				<PaletteIcon size={14} />
				<span className="text-xs font-mono uppercase tracking-wider">
					Presets
				</span>
				{open ? <CaretUpIcon size={12} /> : <CaretDownIcon size={12} />}
			</Button>

			{open && (
				<div className="mt-2 border border-border rounded-sm bg-background">
					<div className="flex border-b border-border">
						{PRESET_CATEGORIES.map((cat) => (
							<button
								key={cat.id}
								type="button"
								onClick={() => setActiveCategory(cat.id)}
								className={`flex-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
									activeCategory === cat.id
										? "text-foreground bg-muted/30"
										: "text-muted-foreground/50 hover:text-muted-foreground"
								}`}
							>
								{cat.name}
							</button>
						))}
					</div>

					<div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
						{filtered.map((preset) => (
							<button
								key={preset.id}
								type="button"
								onClick={() => handleSelect(preset)}
								className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition-colors cursor-pointer text-left"
								aria-label={`Load ${preset.name} palette`}
							>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<span className="text-xs font-mono text-foreground">
											{preset.name}
										</span>
										<span className="text-[10px] font-mono text-muted-foreground/40 uppercase">
											{preset.type}
										</span>
									</div>
									<PresetStrip colors={preset.colors} />
								</div>
								<CopySimpleIcon
									size={12}
									className="shrink-0 text-muted-foreground/30"
								/>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
