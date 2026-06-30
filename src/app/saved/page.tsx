"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { TrashIcon } from "@phosphor-icons/react";
import { generatePalette, type PaletteStep } from "@/lib/color";
import { getItems, deleteItem, type SavedItem } from "@/lib/storage";

type Tab = "all" | "color" | "palette" | "gradient";

const TABS: { value: Tab; label: string }[] = [
	{ value: "all", label: "All" },
	{ value: "color", label: "Colors" },
	{ value: "palette", label: "Palettes" },
	{ value: "gradient", label: "Gradients" },
];

function extractQueryParam(url: string, param: string): string | null {
	const qIndex = url.indexOf("?");
	if (qIndex === -1) return null;
	return new URLSearchParams(url.slice(qIndex)).get(param);
}

function ColorCard({
	item,
	onDelete,
}: {
	item: SavedItem;
	onDelete: (id: string) => void;
}) {
	const hex = useMemo(
		() => item.value || extractQueryParam(item.url, "color") || "#000",
		[item.value, item.url],
	);

	return (
		<div className="group relative">
			<Link href={item.url} className="block">
				<div
					className="aspect-video rounded-sm border border-border/30 overflow-hidden"
					style={{ background: hex }}
				/>
			</Link>
			<div className="mt-2 flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<p className="font-mono text-xs text-foreground truncate">
						{item.label}
					</p>
					{item.value ? (
						<p className="font-mono text-[10px] text-muted-foreground/50 truncate">
							<span className="uppercase">{item.model ?? "hex"}</span>
							{"  "}
							{item.value}
						</p>
					) : (
						<p className="font-mono text-[10px] text-muted-foreground/50">
							{new Date(item.createdAt).toLocaleDateString(undefined, {
								month: "short",
								day: "numeric",
							})}
						</p>
					)}
				</div>
				<button
					type="button"
					onClick={() => onDelete(item.id)}
					className="p-1 text-muted-foreground/30 hover:text-red-400 transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
					aria-label="Delete"
				>
					<TrashIcon size={12} />
				</button>
			</div>
		</div>
	);
}

function PaletteCard({
	item,
	onDelete,
}: {
	item: SavedItem;
	onDelete: (id: string) => void;
}) {
	const seed = useMemo(
		() => item.value || extractQueryParam(item.url, "seed") || "#1a2b3c",
		[item.value, item.url],
	);
	const { steps } = useMemo(() => {
		if (!seed) return { steps: [] as PaletteStep[] };
		return generatePalette(seed);
	}, [seed]);

	return (
		<div className="group relative">
			<Link href={item.url} className="block">
				<div className="aspect-video rounded-sm border border-border/30 overflow-hidden flex">
					{steps.map((s, i) => (
						<div key={i} className="flex-1" style={{ background: s.hex }} />
					))}
				</div>
			</Link>
			<div className="mt-2 flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<p className="font-mono text-xs text-foreground truncate">
						{item.label}
					</p>
					<p className="font-mono text-[10px] text-muted-foreground/50">
						{new Date(item.createdAt).toLocaleDateString(undefined, {
							month: "short",
							day: "numeric",
						})}
					</p>
				</div>
				<button
					type="button"
					onClick={() => onDelete(item.id)}
					className="p-1 text-muted-foreground/30 hover:text-red-400 transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
					aria-label="Delete"
				>
					<TrashIcon size={12} />
				</button>
			</div>
		</div>
	);
}

function GradientCard({
	item,
	onDelete,
}: {
	item: SavedItem;
	onDelete: (id: string) => void;
}) {
	return (
		<div className="group relative">
			<Link href={item.url} className="block">
				<div
					className="aspect-video rounded-sm border border-border/30 overflow-hidden"
					style={{
						background:
							item.value || "linear-gradient(90deg, #6366f1, #f97316)",
					}}
				/>
			</Link>
			<div className="mt-2 flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<p className="font-mono text-xs text-foreground truncate">
						{item.label}
					</p>
					<p className="font-mono text-[10px] text-muted-foreground/50">
						{new Date(item.createdAt).toLocaleDateString(undefined, {
							month: "short",
							day: "numeric",
						})}
					</p>
				</div>
				<button
					type="button"
					onClick={() => onDelete(item.id)}
					className="p-1 text-muted-foreground/30 hover:text-red-400 transition-colors cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
					aria-label="Delete"
				>
					<TrashIcon size={12} />
				</button>
			</div>
		</div>
	);
}

export default function SavedPage() {
	const [items, setItems] = useState<SavedItem[]>(() => getItems());
	const [tab, setTab] = useState<Tab>("all");

	const filtered = tab === "all" ? items : items.filter((i) => i.type === tab);

	const handleDelete = useCallback((id: string) => {
		deleteItem(id);
		setItems((prev) => prev.filter((i) => i.id !== id));
	}, []);

	const renderItem = useCallback(
		(item: SavedItem) => {
			switch (item.type) {
				case "color":
					return (
						<ColorCard key={item.id} item={item} onDelete={handleDelete} />
					);
				case "palette":
					return (
						<PaletteCard key={item.id} item={item} onDelete={handleDelete} />
					);
				case "gradient":
					return (
						<GradientCard key={item.id} item={item} onDelete={handleDelete} />
					);
			}
		},
		[handleDelete],
	);

	return (
		<section className="min-h-[calc(100dvh-88px)] h-full w-full max-w-5xl m-auto flex flex-col px-4 py-16 gap-6">
			<div className="flex flex-col gap-1">
				<h1 className="font-mono text-sm text-foreground tracking-tight">
					Saved
				</h1>
				<p className="font-mono text-[10px] text-muted-foreground/50">
					Colors, palettes, and gradients you&apos;ve bookmarked.
				</p>
				<p className="font-mono text-[10px] text-muted-foreground/30">
					Stored in local storage &mdash; cleared when you wipe browser data.{" "}
					Cloud sync &amp; organization WIP.
				</p>
			</div>

			<div className="flex items-center gap-1.5 border-b border-border/50">
				{TABS.map((t) => (
					<button
						key={t.value}
						type="button"
						onClick={() => setTab(t.value)}
						className={`px-3 py-1.5 text-xs font-mono border-b-2 transition-colors cursor-pointer ${
							tab === t.value
								? "border-foreground text-foreground"
								: "border-transparent text-muted-foreground/50 hover:text-foreground"
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{filtered.length === 0 ? (
				<div className="flex flex-col items-center gap-3 pt-16 text-center">
					<p className="font-mono text-xs text-muted-foreground/50">
						Nothing saved yet.
					</p>
					<div className="flex items-center gap-3 mt-1">
						<Link
							href="/picker"
							className="font-mono text-xs text-foreground hover:underline underline-offset-4"
						>
							Pick a color
						</Link>
						<span className="text-muted-foreground/30">·</span>
						<Link
							href="/palette"
							className="font-mono text-xs text-foreground hover:underline underline-offset-4"
						>
							Generate a palette
						</Link>
						<span className="text-muted-foreground/30">·</span>
						<Link
							href="/gradient"
							className="font-mono text-xs text-foreground hover:underline underline-offset-4"
						>
							Create a gradient
						</Link>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
					{filtered.map(renderItem)}
				</div>
			)}
		</section>
	);
}
