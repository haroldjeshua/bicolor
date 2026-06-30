"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { sileo } from "sileo";
import { saveItem, type SavedItem } from "@/lib/storage";

export default function SaveButton({
	type,
	label,
}: {
	type: SavedItem["type"];
	label: string;
}) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const handleSave = useCallback(() => {
		const params = new URLSearchParams(searchParams.toString());
		const url = `${pathname}?${params.toString()}`;
		saveItem({ type, label, url });
		sileo.success({
			title: "Saved",
			icon: <BookmarkSimpleIcon size={16} />,
			description: (
				<span className="flex items-center gap-2">
					<BookmarkSimpleIcon size={14} className="text-muted-foreground" />
					{label}
				</span>
			),
		});
	}, [pathname, searchParams, type, label]);

	return (
		<button
			type="button"
			onClick={handleSave}
			className="text-background/60 hover:text-muted transition-colors cursor-pointer p-1.5"
			aria-label={`Save ${type}`}
		>
			<BookmarkSimpleIcon size={14} />
		</button>
	);
}
