"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
	ArrowsLeftRightIcon,
	ArrowUpRightIcon,
	BookmarkSimpleIcon,
	GradientIcon,
	PaletteIcon,
	TextAaIcon,
} from "@phosphor-icons/react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import SaveDialog from "@/components/SaveDialog";
import type { NamedColor } from "@/lib/colors";

function randomHex(): string {
	return (
		"#" +
		Math.floor(Math.random() * 0xffffff)
			.toString(16)
			.padStart(6, "0")
	);
}

export default function NamesActionBar({ color }: { color: NamedColor }) {
	const [saveOpenId, setSaveOpenId] = useState<string | null>(null);
	const saveOpen = saveOpenId === color.id;

	const copyName = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(color.name);
			sileo.success({
				title: "Copied name",
				description: color.name,
			});
		} catch {}
	}, [color.name]);

	const saveUrl = `/names?q=${encodeURIComponent(color.name)}&collection=${color.collection}`;
	const gradientUrl = `/gradient?type=linear&angle=90&stops=${encodeURIComponent(
		JSON.stringify([
			{ color: color.hex, position: 0 },
			{ color: randomHex(), position: 100 },
		]),
	)}`;

	return (
		<div className="flex items-center gap-3">
			<Button
				variant="bare"
				size="sm"
				onClick={copyName}
				className="text-background/60 hover:text-muted"
				aria-label="Copy name"
			>
				<TextAaIcon size={14} />
				<span className="hidden md:inline">Name</span>
			</Button>

			<Button
				variant="bare"
				size="sm"
				asChild
				className="text-background/60 hover:text-muted"
			>
				<Link
					href={`/picker?color=${encodeURIComponent(color.hex)}`}
					aria-label="Open in picker"
				>
					<ArrowUpRightIcon size={14} />
					<span className="hidden md:inline">Picker</span>
				</Link>
			</Button>

			<Button
				variant="bare"
				size="sm"
				asChild
				className="text-background/60 hover:text-muted"
			>
				<Link
					href={`/convert?from=hex&value=${encodeURIComponent(color.hex)}`}
					aria-label="Open in convert"
				>
					<ArrowsLeftRightIcon size={14} />
					<span className="hidden md:inline">Convert</span>
				</Link>
			</Button>

			<Button
				variant="bare"
				size="sm"
				asChild
				className="text-background/60 hover:text-muted"
			>
				<Link
					href={`/palette?seed=${encodeURIComponent(color.hex)}`}
					aria-label="Generate palette from this color"
				>
					<PaletteIcon size={14} />
					<span className="hidden md:inline">Palette</span>
				</Link>
			</Button>

			<Button
				variant="bare"
				size="sm"
				asChild
				className="text-background/60 hover:text-muted"
			>
				<Link
					href={gradientUrl}
					aria-label="Start a gradient from this color"
				>
					<GradientIcon size={14} />
					<span className="hidden md:inline">Gradient</span>
				</Link>
			</Button>

			<Button
				variant="bare"
				size="sm"
				onClick={() => setSaveOpenId(color.id)}
				className="text-background/60 hover:text-muted"
				aria-label="Save color"
			>
				<BookmarkSimpleIcon size={14} />
				<span className="hidden md:inline">Save</span>
			</Button>

			<SaveDialog
				open={saveOpen}
				onOpenChange={(open) => setSaveOpenId(open ? color.id : null)}
				type="color"
				hex={color.hex}
				url={saveUrl}
			/>
		</div>
	);
}
