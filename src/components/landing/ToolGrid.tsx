"use client";

import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { HexColorPicker } from "react-colorful";
import {
	ArrowRightIcon,
	CheckIcon,
	CopyIcon,
	ShuffleIcon,
} from "@phosphor-icons/react";
import { convert, generatePalette } from "@/lib/color";
import { wcagRatio } from "@/lib/contrast";
import { ALL_NAMED_COLORS, COLLECTION_COUNTS, type NamedColor } from "@/lib/colors";

const SEED = "#6366f1";

function blendWithWhite(hex: string, amount: number) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	const nr = Math.round(r + (255 - r) * amount);
	const ng = Math.round(g + (255 - g) * amount);
	const nb = Math.round(b + (255 - b) * amount);
	return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

function randomHex(): string {
	const value = Math.floor(Math.random() * 0xffffff);
	return `#${value.toString(16).padStart(6, "0")}`;
}

function pickRandomName(excludeId?: string): NamedColor {
	for (;;) {
		const entry =
			ALL_NAMED_COLORS[Math.floor(Math.random() * ALL_NAMED_COLORS.length)];
		if (entry.id !== excludeId) return entry;
	}
}

function Tile({
	index,
	name,
	role,
	href,
	children,
	clip = true,
}: {
	index: string;
	name: string;
	role: string;
	href: string;
	children: ReactNode;
	clip?: boolean;
}) {
	return (
		<div className="group relative flex h-full flex-col gap-3 bg-background p-4 transition-colors duration-150 hover:bg-muted/20 focus-within:bg-muted/20 sm:p-5">
			<Link
				href={href}
				aria-label={`Open ${name}`}
				suppressHydrationWarning
				className="flex w-fit items-baseline gap-2 rounded-[2px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
			>
				<span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
					{index} / {name}
				</span>
				<ArrowRightIcon
					size={11}
					aria-hidden="true"
					className="-translate-x-1 text-muted-foreground/40 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
				/>
			</Link>
			<p className="max-w-[30ch] font-mono text-[11px] leading-snug text-muted-foreground/70">
				{role}
			</p>
			<div
				className={`mt-auto flex h-36 items-stretch border border-border/50 bg-muted/10 sm:h-40 ${clip ? "overflow-hidden" : "overflow-visible"}`}
			>
				{children}
			</div>
		</div>
	);
}

export function ToolGrid() {
	const [color, setColor] = useState(SEED);
	const [copied, setCopied] = useState<string | null>(null);

	// Site-wide demo-color sync: logo follows the picker, same as the tool pages.
	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty("--logo-fill-1", color);
		root.style.setProperty("--logo-fill-2", blendWithWhite(color, 0.3));
		root.style.setProperty("--logo-fill-3", blendWithWhite(color, 0.55));
		try {
			sessionStorage.setItem("demoColor", color);
		} catch {
			// private mode: fine to skip
		}
	}, [color]);

	// Transient "copied" acknowledgement, shared by every tile.
	useEffect(() => {
		if (!copied) return;
		const id = window.setTimeout(() => setCopied(null), 1400);
		return () => window.clearTimeout(id);
	}, [copied]);

	const handleCopy = async (text: string, key: string) => {
		const ok = await copyText(text);
		if (ok) setCopied(key);
	};

	const hexParam = encodeURIComponent(color);
	const oklchValue = convert(color, "hex", "oklch") ?? "—";
	const palette = generatePalette(color);

	return (
		<div className="relative mt-6 grid grid-cols-1 gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
			{/* 01 / picker */}
			<Tile
				index="01"
				name="picker"
				role="Pick visually, read every model at once."
				href={`/picker?color=${hexParam}`}
			>
				<div className="relative flex h-full w-full items-center justify-center p-1.5">
					<HexColorPicker
						color={color}
						onChange={setColor}
						className="h-full! w-full! rounded-[3px]!"
					/>
					<span className="pointer-events-none absolute bottom-2 left-2.5 rounded-[2px] bg-background/75 px-1 py-0.5 font-mono text-[9px] text-foreground backdrop-blur-sm">
						{color}
					</span>
				</div>
			</Tile>

			{/* 02 / convert */}
			<Tile
				index="02"
				name="convert"
				role="Two fields, any pair of models."
				href={`/convert?from=hex&value=${hexParam}&to=oklch`}
			>
				<div className="flex w-full flex-col items-center justify-center gap-2 px-3">
					<div className="flex max-w-full items-center gap-1.5">
						<span className="shrink-0 rounded-[3px] border border-border/60 bg-background px-1.5 py-1 font-mono text-[10px] text-foreground">
							{color}
						</span>
						<ArrowRightIcon size={10} className="shrink-0 text-muted-foreground/60" aria-hidden="true" />
						<button
							type="button"
							onClick={() => handleCopy(oklchValue, "oklch")}
							aria-label={copied === "oklch" ? "Copied" : `Copy ${oklchValue}`}
							className="flex min-w-0 cursor-pointer items-center gap-1 rounded-[3px] border border-border/60 bg-background px-1.5 py-1 font-mono text-[10px] text-foreground outline-none transition-colors hover:border-foreground/40 focus-visible:ring-1 focus-visible:ring-ring"
						>
							<span className="truncate">{oklchValue}</span>
							{copied === "oklch" ? (
								<CheckIcon size={10} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
							) : (
								<CopyIcon size={10} className="shrink-0 text-muted-foreground/60" aria-hidden="true" />
							)}
						</button>
					</div>
					<span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
						hex · rgb · hsl · oklch · oklab · lch
					</span>
				</div>
			</Tile>

			{/* 03 / palette */}
			<Tile
				index="03"
				name="palette"
				role="One seed, an 11-step oklch scale."
				href={`/palette?seed=${hexParam}`}
			>
				<div className="flex w-full flex-col justify-center gap-2 px-4">
					<div className="flex items-center justify-between gap-2 font-mono text-[10px]">
						<span className="flex items-center gap-1.5 text-foreground">
							<span
								className="inline-block size-2.5 rounded-[2px]"
								style={{ background: color }}
							/>
							{color}
						</span>
						<span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
							{copied?.startsWith("step-") ? "copied" : "click to copy"}
						</span>
					</div>
					<div className="flex h-16 w-full overflow-hidden rounded-[3px]">
						{palette.steps.map((step) => (
							<button
								key={step.index}
								type="button"
								title={step.hex}
								aria-label={`Copy ${step.hex}`}
								onClick={() => handleCopy(step.hex, `step-${step.index}`)}
								className="h-full flex-1 cursor-pointer outline-none transition-[filter] hover:brightness-110 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
								style={{ background: step.hex }}
							/>
						))}
					</div>
				</div>
			</Tile>

			{/* 04 / gradient — first stop follows the picker, second is randomized */}
			<GradientTile color={color} />

			{/* 05 / contrast — introductory pair picker */}
			<ContrastTile />

			{/* 06 / names — featured random entry */}
			<NamesTile />
		</div>
	);
}

function GradientTile({ color }: { color: string }) {
	// Randomized on every mount; suppressHydrationWarning on the volatile bits.
	const [second, setSecond] = useState(randomHex);

	const swatchHref = `/gradient?type=linear&angle=150&stops=${encodeURIComponent(
		JSON.stringify([
			{ color, position: 0 },
			{ color: second, position: 100 },
		]),
	)}`;

	const randomize = () => setSecond(randomHex());
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			randomize();
		}
	};

	return (
		<Tile
			index="04"
			name="gradient"
			role="Stops, an angle, a live render."
			href={swatchHref}
		>
			<div
				role="button"
				tabIndex={0}
				aria-label="Randomize the second gradient stop"
				onClick={randomize}
				onKeyDown={onKeyDown}
				className="group/field relative h-full w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
				style={{ background: `linear-gradient(150deg, ${color} 0%, ${second} 100%)` }}
				suppressHydrationWarning
			>
				{[8, 50, 92].map((left) => (
					<span
						key={left}
						aria-hidden="true"
						className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/20 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
						style={{ left: `${left}%` }}
					/>
				))}
				<span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-[2px] bg-black/55 px-1 py-0.5 font-mono text-[9px] text-white">
					150°
				</span>
				<ShuffleIcon
					size={12}
					aria-hidden="true"
					className="pointer-events-none absolute right-1.5 top-1.5 text-white opacity-0 transition-opacity duration-150 group-hover/field:opacity-90 group-focus-visible/field:opacity-90"
				/>
			</div>
		</Tile>
	);
}

function ContrastTile() {
	const [fg, setFg] = useState("#ffffff");
	const [bg, setBg] = useState("#0a0a0a");
	const [pickerOpen, setPickerOpen] = useState<"fg" | "bg" | null>(null);

	const ratio = wcagRatio(fg, bg);
	const passes = ratio !== null && ratio >= 4.5;

	useEffect(() => {
		if (!pickerOpen) return;
		const onKeyDown = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") setPickerOpen(null);
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [pickerOpen]);

	const href = `/contrast?fg=${encodeURIComponent(fg)}&bg=${encodeURIComponent(bg)}`;

	const swatchButton = (which: "fg" | "bg") => (
		<button
			type="button"
			onClick={() => setPickerOpen(pickerOpen === which ? null : which)}
			aria-label={which === "fg" ? "Pick foreground color" : "Pick background color"}
			aria-expanded={pickerOpen === which}
			className="flex cursor-pointer items-center gap-1.5 rounded-[2px] px-1 py-0.5 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring"
		>
			<span
				className="inline-block size-3.5 rounded-[2px] border border-border/60"
				style={{ background: which === "fg" ? fg : bg }}
			/>
			<span className="font-mono text-[10px] text-foreground">
				{which === "fg" ? fg : bg}
			</span>
		</button>
	);

	return (
		<Tile
			index="05"
			name="contrast"
			role="WCAG 2.2 ratio, weakest point included."
			href={href}
			clip={false}
		>
			<div className="relative flex h-full w-full items-center justify-between gap-3 overflow-visible px-3">
				<div className="flex flex-col gap-1.5">
					{swatchButton("fg")}
					{swatchButton("bg")}
				</div>
				<div className="text-right">
					<div className="font-mono text-lg leading-none text-foreground">
						{ratio?.toFixed(2) ?? "--"}
						<span className="text-xs text-muted-foreground/60">:1</span>
					</div>
					<div
						className={`mt-1.5 font-mono text-[9px] uppercase tracking-[0.18em] ${
							passes
								? "text-emerald-600 dark:text-emerald-400"
								: "text-red-600 dark:text-red-400"
						}`}
					>
						AA normal · {passes ? "pass" : "fail"}
					</div>
				</div>

				{pickerOpen && (
					<>
						<div
							className="fixed inset-0 z-40 cursor-default"
							onPointerDown={() => setPickerOpen(null)}
						/>
						<div className="absolute bottom-full left-2 z-50 mb-2 rounded-lg border border-border bg-background p-1.5 shadow-lg">
							<HexColorPicker
								color={pickerOpen === "fg" ? fg : bg}
								onChange={pickerOpen === "fg" ? setFg : setBg}
								className="rounded-md"
							/>
						</div>
					</>
				)}
			</div>
		</Tile>
	);
}

function NamesTile() {
	// Randomized on every mount; suppressHydrationWarning on the volatile bits.
	const [entry, setEntry] = useState<NamedColor>(() => pickRandomName());

	const shuffle = () => setEntry((current) => pickRandomName(current.id));

	const meta =
		entry.collection === "tailwind" && entry.family
			? `tailwind - ${entry.family} ${entry.shade}`
			: entry.collection === "css"
				? `css - ${COLLECTION_COUNTS.css} names`
				: `xkcd - ${COLLECTION_COUNTS.xkcd} responses`;

	const href = `/names?color=${encodeURIComponent(entry.hex)}`;

	return (
		<Tile
			index="06"
			name="names"
			role="CSS, Tailwind and XKCD names, searchable."
			href={href}
		>
			<div className="relative flex h-full w-full items-center gap-3 px-4">
				<span
					className="size-16 shrink-0 rounded-[3px] border border-border/40"
					style={{ background: entry.hex }}
					suppressHydrationWarning
				/>
				<span className="min-w-0">
					<span
						className="block truncate font-mono text-[11px] text-foreground"
						suppressHydrationWarning
					>
						{entry.name}
					</span>
					<span
						className="block font-mono text-[10px] text-muted-foreground/70"
						suppressHydrationWarning
					>
						{entry.hex}
					</span>
					<span
						className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50"
						suppressHydrationWarning
					>
						{meta}
					</span>
				</span>
				<button
					type="button"
					onClick={shuffle}
					aria-label="Feature a random color name"
					className="absolute right-1.5 top-1.5 cursor-pointer rounded-[2px] p-1 text-muted-foreground/60 outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
				>
					<ShuffleIcon size={12} aria-hidden="true" />
				</button>
			</div>
		</Tile>
	);
}
