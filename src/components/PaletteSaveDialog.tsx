"use client";

import { useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { sileo } from "sileo";
import { saveItem, type SavedItem } from "@/lib/storage";
import ColorSwatch from "@/components/ColorSwatch";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PaletteSaveDialog({
	open,
	onOpenChange,
	seed,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	seed: string;
}) {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [label, setLabel] = useState("");

	const handleSave = useCallback(() => {
		const params = new URLSearchParams(searchParams.toString());
		const url = `${pathname}?${params.toString()}`;
		const finalLabel = label.trim() || `palette ${seed}`;
		saveItem({
			type: "palette",
			label: finalLabel,
			url,
			value: seed,
		});
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
	}, [seed, label, pathname, searchParams, onOpenChange]);

	const handleCancel = useCallback(() => {
		setLabel("");
		onOpenChange(false);
	}, [onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Save palette</DialogTitle>
				</DialogHeader>

				<div className="flex items-center gap-3 py-2">
					<ColorSwatch color={seed} size="md" />
					<span className="font-mono text-xs text-muted-foreground truncate min-w-0">
						{seed}
					</span>
				</div>

				<div className="space-y-1.5">
					<label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
						Label
					</label>
					<input
						type="text"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder={`palette ${seed}`}
						className="w-full bg-transparent border border-border rounded-sm px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:border-ring transition-colors placeholder:text-muted-foreground/30"
					/>
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
