"use client";

import { useState, useCallback, useEffect } from "react";
import { XIcon, PaletteIcon } from "@phosphor-icons/react";
import { PRESETS, PRESET_CATEGORIES, type PresetPalette } from "@/lib/presets";

interface PresetDrawerProps {
	open: boolean;
	onClose: () => void;
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

export default function PresetDrawer({ open, onClose, onSelectPreset }: PresetDrawerProps) {
	const [activeCategory, setActiveCategory] = useState<string>(PRESET_CATEGORIES[0]?.id ?? "");

	useEffect(() => {
		if (!open) return;
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [open, onClose]);

	const filtered = PRESETS.filter((p) => {
		const cat = PRESET_CATEGORIES.find((c) =>
			p.source.toLowerCase().includes(c.id),
		);
		return cat?.id === activeCategory;
	});

	const handleSelect = useCallback(
		(preset: PresetPalette) => {
			onSelectPreset(preset);
			onClose();
		},
		[onSelectPreset, onClose],
	);

	return (
		<>
			{open && (
				<div
					className="fixed inset-0 z-40 bg-black/30"
					onPointerDown={onClose}
				/>
			)}
			<div
				className={`fixed top-0 right-0 z-50 h-full w-full sm:w-1/2 max-w-lg bg-background border-l border-border shadow-2xl transition-transform duration-200 ease-out flex flex-col ${
					open ? "translate-x-0" : "translate-x-full"
				}`}
				onPointerDown={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-4 h-12 border-b border-border shrink-0">
					<div className="flex items-center gap-2">
						<PaletteIcon size={14} className="text-muted-foreground/60" />
						<span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/60">
							Presets
						</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
						aria-label="Close presets"
					>
						<XIcon size={16} />
					</button>
				</div>

				<div className="flex border-b border-border shrink-0">
					{PRESET_CATEGORIES.map((cat) => (
						<button
							key={cat.id}
							type="button"
							onClick={() => setActiveCategory(cat.id)}
							className={`flex-1 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
								activeCategory === cat.id
									? "text-foreground bg-muted/30"
									: "text-muted-foreground/50 hover:text-muted-foreground"
							}`}
						>
							{cat.name}
						</button>
					))}
				</div>

				<div className="flex-1 overflow-y-auto p-3 pb-16 space-y-2">
					{filtered.map((preset) => (
						<button
							key={preset.id}
							type="button"
							onClick={() => handleSelect(preset)}
							className="w-full flex items-center gap-3 p-3 rounded-sm border border-border/50 bg-muted/10 hover:bg-muted/30 hover:border-border transition-colors cursor-pointer text-left"
							aria-label={`Load ${preset.name} palette`}
						>
							<div className="flex-1 min-w-0 space-y-1.5">
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
						</button>
					))}
				</div>
			</div>
		</>
	);
}
