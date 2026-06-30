"use client";

import { useState, useCallback, useMemo } from "react";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { sileo } from "sileo";
import { saveItem } from "@/lib/storage";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GradientSaveDialog({
	open,
	onOpenChange,
	type,
	angle,
	gradientCSS,
	url,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type: string;
	angle: number;
	gradientCSS: string;
	url: string;
}) {
	const [label, setLabel] = useState("");
	const defaultLabel = useMemo(() => `${type} ${angle}°`, [type, angle]);

	const handleSave = useCallback(() => {
		const finalLabel = label.trim() || defaultLabel;
		saveItem({ type: "gradient", label: finalLabel, url, value: gradientCSS });
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
	}, [label, defaultLabel, url, gradientCSS, onOpenChange]);

	const handleCancel = useCallback(() => {
		setLabel("");
		onOpenChange(false);
	}, [onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm" showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>Save gradient</DialogTitle>
				</DialogHeader>

				<div
					className="w-full h-16 rounded-sm border border-border/30"
					style={{ background: gradientCSS }}
				/>

				<div className="space-y-1.5">
					<label className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
						Label
					</label>
					<input
						type="text"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder={defaultLabel}
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
