"use client";

import { useState, useCallback, useMemo } from "react";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { sileo } from "sileo";
import { saveItem, type SavedItem } from "@/lib/storage";
import { convert } from "@/lib/color";
import { MODELS, MODEL_LABELS, type ColorModel } from "@/lib/constants";
import ColorSwatch from "@/components/ColorSwatch";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function SaveDialog({
	open,
	onOpenChange,
	type,
	hex,
	url,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type: SavedItem["type"];
	hex: string;
	url: string;
}) {
	const [label, setLabel] = useState("");
	const [model, setModel] = useState<ColorModel>("hex");

	const displayValue = useMemo(
		() => convert(hex, "hex", model) ?? hex,
		[hex, model],
	);

	const handleSave = useCallback(() => {
		const finalLabel = label.trim() || hex;
		saveItem({ type, label: finalLabel, url, value: displayValue, model });
		sileo.success({
			title: "Saved",
			icon: <BookmarkSimpleIcon size={16} />,
			description: (
				<span className="flex items-center gap-2">
					<BookmarkSimpleIcon size={14} className="text-muted-foreground" />
					{finalLabel}
				</span>
			),
		});
		onOpenChange(false);
	}, [type, label, hex, url, displayValue, model, onOpenChange]);

	const handleCancel = useCallback(() => {
		setLabel("");
		onOpenChange(false);
	}, [onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Save color</DialogTitle>
				</DialogHeader>

				<div className="flex items-center gap-3 py-2">
					<ColorSwatch color={hex} size="md" />
					<span className="font-mono text-xs text-muted-foreground truncate min-w-0">
						{displayValue}
					</span>
				</div>

				<div className="space-y-3">
					<div className="space-y-1.5">
						<label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
							Label
						</label>
						<input
							type="text"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder={hex}
							className="w-full bg-transparent border border-border rounded-sm px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/30"
						/>
					</div>

					<div className="space-y-1.5">
						<label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
							Color value
						</label>
						<Select
							value={model}
							onValueChange={(v) => setModel(v as ColorModel)}
						>
							<SelectTrigger className="w-full font-mono text-xs h-8">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{MODELS.map((m) => (
									<SelectItem key={m} value={m} className="font-mono text-xs cursor-pointer">
										{MODEL_LABELS[m]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter className="mt-2">
					<Button variant="outline" size="sm" onClick={handleCancel}>
						Cancel
					</Button>
					<Button variant="default" size="sm" onClick={handleSave}>
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
