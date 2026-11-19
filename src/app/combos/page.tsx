"use client";

import {
	useState,
	useCallback,
	useEffect,
	useMemo,
	Suspense,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import ColorSwatch from "@/components/ColorSwatch";
import ColorInput from "@/components/ColorInput";
import { useActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import SegmentedControl from "@/components/names/SegmentedControl";
import {
	findClosestNamedColor,
	oklchChannels,
	suggestAccent,
	convert,
	type HarmonyMode,
} from "@/lib/color";
import { type ColorModel } from "@/lib/constants";
import {
	ArrowRightIcon,
	CopyIcon,
	LinkSimpleIcon,
	ShuffleIcon,
} from "@phosphor-icons/react";
import { sileo } from "sileo";

const DEFAULT_C1 = "#6366f1";
const DEFAULT_C2 = "#f59e0b";

function textColorOn(hex: string): "black" | "white" {
	const channels = oklchChannels(hex);
	const l = channels?.l ?? 0.5;
	return l > 0.55 ? "black" : "white";
}

function SwatchLabel({
	color,
}: {
	color: string;
}) {
	const label = useMemo(() => findClosestNamedColor(color), [color]);
	const ink = textColorOn(color);
	return (
		<div className="flex flex-col items-center gap-2">
			<div
				className="relative flex items-center justify-center h-40 w-48 rounded-xl border border-border/60 shadow-sm"
				style={{ background: color }}
			>
				{label ? (
					<span
						className={`font-mono text-[11px] font-bold tracking-tight ${
							ink === "black" ? "text-black" : "text-white"
						}`}
					>
						{label.name}
					</span>
				) : null}
			</div>
			<div className="flex flex-col items-center gap-1">
				<span className="font-mono text-[11px] text-foreground truncate w-40">
					{color}
				</span>
				{label ? (
					<span
						className="font-mono text-[9px] text-muted-foreground/60 truncate w-40 uppercase tracking-wider"
						title={label.name}
					>
						{label.name}
					</span>
				) : null}
			</div>
		</div>
	);
}

function CombosPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { setContent } = useActionBar();

	const [c1Hex, setC1Hex] = useState(() => searchParams.get("c1") ?? DEFAULT_C1);
	const [c2Hex, setC2Hex] = useState(() => searchParams.get("c2") ?? DEFAULT_C2);
	const [c1Model, setC1Model] = useState<ColorModel>("hex");
	const [c2Model, setC2Model] = useState<ColorModel>("hex");
	const [accentHex, setAccentHex] = useState<string | null>(null);
	const [accentModel, setAccentModel] = useState<ColorModel>("hex");
	const [mode, setMode] = useState<HarmonyMode>(() => {
		const m = searchParams.get("mode");
		return m === "analogous" || m === "triadic" ? m : "complementary";
	});
	const [accentManual, setAccentManual] = useState(false);

	// Accent: auto-suggested from c1/c2/mode unless user typed it.
	const accent = useMemo(
		() => (accentManual ? accentHex : suggestAccent(c1Hex, c2Hex, mode)),
		[c1Hex, c2Hex, mode, accentHex, accentManual],
	);

	// Display values in each input's current model.
	const c1Value = useMemo(
		() => convert(c1Hex, "hex", c1Model) ?? c1Hex,
		[c1Hex, c1Model],
	);
	const c2Value = useMemo(
		() => convert(c2Hex, "hex", c2Model) ?? c2Hex,
		[c2Hex, c2Model],
	);
	const accentValue = useMemo(
		() => (accent ? convert(accent, "hex", accentModel) ?? accent : ""),
		[accent, accentModel],
	);

	const syncUrl = useCallback(() => {
		const params = new URLSearchParams();
		params.set("c1", c1Hex);
		params.set("c2", c2Hex);
		if (accent) params.set("accent", accent);
		params.set("mode", mode);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}, [c1Hex, c2Hex, accent, mode, router, pathname]);

	useEffect(() => {
		syncUrl();
	}, [c1Hex, c2Hex, accent, mode, syncUrl]);

	const handleC1Change = useCallback(
		(value: string) => {
			const parsed = convert(value, c1Model, "hex");
			if (parsed) {
				setC1Hex(parsed);
				setAccentManual(false);
			}
		},
		[c1Model],
	);

	const handleC2Change = useCallback(
		(value: string) => {
			const parsed = convert(value, c2Model, "hex");
			if (parsed) {
				setC2Hex(parsed);
				setAccentManual(false);
			}
		},
		[c2Model],
	);

	const handleAccentChange = useCallback(
		(value: string) => {
			const parsed = convert(value, accentModel, "hex");
			if (parsed) {
				setAccentHex(parsed);
				setAccentManual(true);
			}
		},
		[accentModel],
	);

	const handleC1ModelChange = useCallback(
		(model: ColorModel) => {
			const converted = convert(c1Hex, "hex", model);
			if (converted) setC1Model(model);
		},
		[c1Hex],
	);

	const handleC2ModelChange = useCallback(
		(model: ColorModel) => {
			const converted = convert(c2Hex, "hex", model);
			if (converted) setC2Model(model);
		},
		[c2Hex],
	);

	const handleAccentModelChange = useCallback(
		(model: ColorModel) => {
			if (!accent) return;
			const converted = convert(accent, "hex", model);
			if (converted) setAccentModel(model);
		},
		[accent],
	);

	const handleShuffle = useCallback(() => {
		const random = () =>
			`#${Math.floor(Math.random() * 0xffffff)
				.toString(16)
				.padStart(6, "0")}`;
		const newC1 = random();
		setC1Hex(newC1);
		setC2Hex(suggestAccent(newC1, newC1, "analogous") ?? newC1);
		setAccentManual(false);
	}, []);

	const handleSwap = useCallback(() => {
		setC1Hex(c2Hex);
		setC2Hex(c1Hex);
		setAccentManual(false);
	}, [c1Hex, c2Hex]);

	const handleReset = useCallback(() => {
		setC1Hex(DEFAULT_C1);
		setC2Hex(DEFAULT_C2);
		setMode("complementary");
		setAccentManual(false);
	}, []);

	const handleCopyAll = useCallback(async () => {
		const lines = [`# Combo colors`];
		if (c1Hex) lines.push(`c1: ${c1Hex}`);
		if (c2Hex) lines.push(`c2: ${c2Hex}`);
		if (accent) lines.push(`accent: ${accent}`);
		try {
			await navigator.clipboard.writeText(lines.join("\n"));
			sileo.success({
				title: "Copied combo colors",
				icon: <CopyIcon size={16} />,
			});
		} catch {}
	}, [c1Hex, c2Hex, accent]);

	// Label lookups via /names engine
	const label1 = useMemo(() => findClosestNamedColor(c1Hex), [c1Hex]);
	const label2 = useMemo(() => findClosestNamedColor(c2Hex), [c2Hex]);
	const labelAccent = useMemo(
		() => (accent ? findClosestNamedColor(accent) : null),
		[accent],
	);

	// ActionBar: Swap · Copy all · Share
	useEffect(() => {
		setContent(
			<div className="flex items-center gap-3">
				<Button
					type="button"
					onClick={handleSwap}
					aria-label="Swap dominant colors"
					className="h-8 px-2 font-mono text-xs"
				>
					<ArrowRightIcon size={12} className="rotate-180" />
					<ArrowRightIcon size={12} />
				</Button>
				<Button
					type="button"
					onClick={handleCopyAll}
					aria-label="Copy all colors"
					className="h-8 px-2 font-mono text-xs"
				>
					<CopyIcon size={12} />
				</Button>
				<Link
					href={`${pathname}?c1=${encodeURIComponent(c1Hex)}&c2=${encodeURIComponent(
						c2Hex,
					)}&mode=${mode}${accent ? `&accent=${encodeURIComponent(accent)}` : ""}`}
					aria-label="Share combo URL"
				>
					<Button
						type="button"
						className="h-8 px-2 font-mono text-xs"
					>
						<LinkSimpleIcon size={12} />
					</Button>
				</Link>
			</div>
		);
	}, [c1Hex, c2Hex, accent, mode, pathname, setContent, handleSwap, handleCopyAll]);

	return (
		<section className="min-h-[calc(100dvh-48px)] h-full w-full max-w-7xl m-auto flex flex-col px-4 pt-20 pb-32 gap-6 items-center justify-start">
			<div className="w-full max-w-4xl flex flex-col gap-6">
				{/* Big swatches: hero */}
				<div className="flex items-start justify-center gap-6 w-full">
					<SwatchLabel color={c1Hex} />
					<SwatchLabel color={c2Hex} />
					<SwatchLabel color={accent ?? "#ffffff"} />
				</div>

				<h1 className="font-mono text-2xl tracking-tight">combos</h1>
				<p className="max-w-2xl font-mono text-[10px] leading-relaxed text-muted-foreground/60">
					Build a two-color scheme with an accent. Pick your dominants,
					choose a harmony, and preview the trio on a sample interface.
				</p>

				{/* Harmony mode selector */}
				<div className="flex items-center gap-3">
					<span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
						Harmony
					</span>
					<SegmentedControl<HarmonyMode>
						label="Harmony mode"
						value={mode}
						onValueChange={setMode}
						options={[
							{ value: "complementary", label: "Complementary" },
							{ value: "analogous", label: "Analogous" },
							{ value: "triadic", label: "Triadic" },
						]}
					/>
				</div>

				{/* Color inputs — functional model selectors */}
				<div className="mt-4 flex flex-col gap-3 w-full">
					<div className="flex items-center gap-3 w-full">
						<ColorInput
							value={c1Value}
							model={c1Model}
							onValueChange={handleC1Change}
							onModelChange={handleC1ModelChange}
							inputAriaLabel="Dominant color value"
						/>
						<ColorInput
							value={c2Value}
							model={c2Model}
							onValueChange={handleC2Change}
							onModelChange={handleC2ModelChange}
							inputAriaLabel="Secondary color value"
						/>
					</div>
					<div className="flex items-center gap-3 w-full">
						<ColorInput
							value={accentValue ?? ""}
							model={accentModel}
							onValueChange={handleAccentChange}
							onModelChange={handleAccentModelChange}
							inputAriaLabel="Accent color value"
							placeholder={accent ?? "Suggested accent"}
						/>
						<div className="flex items-center gap-1.5 ml-auto">
							<Button
								type="button"
								onClick={handleShuffle}
								aria-label="Shuffle dominant colors"
								className="h-9 px-2 font-mono text-xs cursor-pointer"
							>
								<ShuffleIcon size={12} aria-hidden="true" />
							</Button>
							<Button
								type="button"
								onClick={handleReset}
								aria-label="Reset to defaults"
								className="h-9 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
							>
								Reset
							</Button>
						</div>
					</div>
				</div>

				{/* Sample interface: 60-30-10 applied to a mock UI */}
				<div className="mt-6 flex flex-col gap-3">
					<p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
						Sample interface · 60-30-10
					</p>
					<div className="relative flex w-full max-w-2xl flex-col items-start rounded-xl border border-border bg-background p-6 shadow-lg">
						{/* Main background: c1 (60%) */}
						<div
							className="absolute inset-0 rounded-xl"
							style={{ background: c1Hex }}
						/>
						{/* Header band: c2 (30%) */}
						<div
							className="absolute top-0 left-0 right-0 h-16 rounded-t-xl"
							style={{ background: c2Hex }}
						/>
						{/* Content overlay */}
						<div className="relative z-10 flex flex-col gap-3 p-6">
							<div className="flex items-center gap-2">
								<div className="h-3 w-12 rounded-sm" style={{ background: c2Hex }} />
								<span
									className={`font-mono text-[10px] font-bold tracking-tight ${
										textColorOn(c1Hex) === "black"
											? "text-black"
											: "text-white"
									}`}
								>
									Sample UI
								</span>
							</div>
							<h2
								className={`font-mono text-3xl tracking-tight leading-tight ${
									textColorOn(c1Hex) === "black"
										? "text-black"
										: "text-white"
								}`}
							>
							Edit at the Speed of Thought.
							</h2>
							<p
								className={`font-mono text-[9px] leading-relaxed ${
									textColorOn(c1Hex) === "black"
										? "text-black/70"
										: "text-white/80"
								} max-w-[30ch]`}
							>
								Generate a color scheme from two dominants and see how it
								lives on a real interface.
							</p>
							<div className="mt-6 flex items-center gap-3">
								<button
									type="button"
									aria-label="Primary action"
									className={`flex items-center justify-center gap-2 px-5 py-2 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider shadow-sm ${
										textColorOn(accent ?? "#000000") === "black"
											? "text-black"
											: "text-white"
									}`}
									style={{ background: accent ?? "#000000" }}
								>
									Get started
									<ArrowRightIcon size={10} aria-hidden="true" />
								</button>
								<button
									type="button"
									aria-label="Secondary action"
									className={`flex items-center justify-center gap-2 px-5 py-2 rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider border border-current ${
										textColorOn(c1Hex) === "black"
											? "text-black"
											: "text-white"
									}`}
								>
									Learn more
								</button>
							</div>
						</div>
						{/* Proportion caption */}
						<div className="absolute bottom-2 left-2 right-2 flex justify-between px-2">
							<span className="font-mono text-[9px] text-muted-foreground/50">
								{c1Hex} · 60%
							</span>
							<span className="font-mono text-[9px] text-muted-foreground/50">
								{c2Hex} · 30%
							</span>
							<span className="font-mono text-[9px] text-muted-foreground/50">
								{accent ?? "—"} · 10%
							</span>
						</div>
					</div>
				</div>

				{/* Labeled swatches: names */}
				<div className="mt-4 flex w-full justify-center gap-6">
					{[
						{ key: "c1", color: c1Hex, label: label1, role: "Dominant" },
						{ key: "c2", color: c2Hex, label: label2, role: "Secondary" },
						{
							key: "accent",
							color: accent ?? "",
							label: labelAccent,
							role: "Accent",
						},
					].map((swatch) => (
						<Link
							key={swatch.key}
							href={`/names?color=${encodeURIComponent(swatch.color)}`}
							aria-label={`Open ${swatch.color} in names`}
							className="flex flex-col items-center gap-2"
						>
							<ColorSwatch
								color={swatch.color}
								size="md"
								aria-label={`${swatch.role} color ${swatch.color}`}
							/>
							<div className="flex flex-col items-center gap-0.5">
								<span
									className="font-mono text-[10px] text-foreground truncate w-24"
									title={swatch.color}
								>
									{swatch.color}
								</span>
								{swatch.label ? (
									<span
										className="font-mono text-[8px] text-muted-foreground/60 truncate w-24 uppercase tracking-wider"
										title={`${swatch.label.name} (${swatch.label.hex})`}
									>
										{swatch.label.name}
									</span>
								) : null}
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}

export default function CombosPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
					Loading...
				</div>
			}
		>
			<CombosPageContent />
		</Suspense>
	);
}
