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
import ColorInput from "@/components/ColorInput";
import ColorSwatch from "@/components/ColorSwatch";
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
	ArrowsLeftRightIcon,
	CheckIcon,
	CopyIcon,
	CopySimpleIcon,
	LinkSimpleIcon,
	ShuffleIcon,
} from "@phosphor-icons/react";
import { sileo } from "sileo";

const DEFAULT_C1 = "#6366f1";
const DEFAULT_C2 = "#f59e0b";

function inkOn(hex: string): "black" | "white" {
	const channels = oklchChannels(hex);
	const l = channels?.l ?? 0.5;
	return l > 0.55 ? "black" : "white";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
			{children}
		</span>
	);
}

/** 60-30-10 strip: one dominant flex track with the three stops at 60/30/10. */
function Scale60_30_10({
	c1,
	c2,
	accent,
}: {
	c1: string;
	c2: string;
	accent: string | null;
}) {
	return (
		<div
			className="flex h-8 w-44 overflow-hidden rounded-sm border border-white/10"
			aria-hidden
		>
			<div style={{ width: "60%", background: c1 }} />
			<div style={{ width: "30%", background: c2 }} />
			<div style={{ width: "10%", background: accent ?? "#ffffff" }} />
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
	const [accentHex, setAccentHex] = useState<string | null>(null);
	const [accentManual, setAccentManual] = useState(false);
	const [c1Model, setC1Model] = useState<ColorModel>("hex");
	const [c2Model, setC2Model] = useState<ColorModel>("hex");
	const [accentModel, setAccentModel] = useState<ColorModel>("hex");
	const [mode, setMode] = useState<HarmonyMode>(() => {
		const m = searchParams.get("mode");
		return m === "analogous" || m === "triadic" ? m : "complementary";
	});
	const [copied, setCopied] = useState<string | null>(null);

	const accent = useMemo(
		() => (accentManual ? accentHex : suggestAccent(c1Hex, c2Hex, mode)),
		[c1Hex, c2Hex, mode, accentHex, accentManual],
	);

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

	const copyText = useCallback(async (text: string, key: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(key);
			window.setTimeout(() => setCopied(null), 1400);
		} catch {}
	}, []);

	const handleCopyAll = useCallback(async () => {
		const lines = [
			"bicolor — combos",
			`c1: ${c1Hex}`,
			`c2: ${c2Hex}`,
			`accent: ${accent ?? "—"}`,
			`mode: ${mode}`,
		];
		try {
			await navigator.clipboard.writeText(lines.join("\n"));
			sileo.success({
				title: "Copied combo colors",
				icon: <CopyIcon size={16} />,
			});
		} catch {}
	}, [c1Hex, c2Hex, accent, mode]);

	// Named-color lookups via /names engine
	const label1 = useMemo(() => findClosestNamedColor(c1Hex), [c1Hex]);
	const label2 = useMemo(() => findClosestNamedColor(c2Hex), [c2Hex]);
	const labelAccent = useMemo(
		() => (accent ? findClosestNamedColor(accent) : null),
		[accent],
	);

	const c1Ink = inkOn(c1Hex);
	const c2Ink = inkOn(c2Hex);
	const accentInk = accent ? inkOn(accent) : "black";

	useEffect(() => {
		setContent(
			<>
				<Button
					variant="bare"
					size="sm"
					onClick={handleShuffle}
					className="text-background/60 hover:text-muted"
					aria-label="Shuffle colors"
				>
					<ShuffleIcon size={14} />
					<span className="hidden md:inline">Shuffle</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={handleSwap}
					className="text-background/60 hover:text-muted"
					aria-label="Swap dominant colors"
				>
					<ArrowsLeftRightIcon size={14} />
					<span className="hidden md:inline">Swap</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={handleCopyAll}
					className="text-background/60 hover:text-muted"
					aria-label="Copy all colors"
				>
					<CopySimpleIcon size={14} />
					<span className="hidden md:inline">Copy</span>
				</Button>
				<Link
					href={`${pathname}?c1=${encodeURIComponent(c1Hex)}&c2=${encodeURIComponent(
						c2Hex,
					)}&mode=${mode}${accent ? `&accent=${encodeURIComponent(accent)}` : ""}`}
					aria-label="Share combo URL"
				>
					<Button
						variant="bare"
						size="sm"
						className="text-background/60 hover:text-muted"
					>
						<LinkSimpleIcon size={14} />
						<span className="hidden md:inline">Share</span>
					</Button>
				</Link>
			</>
		);
	}, [c1Hex, c2Hex, accent, mode, pathname, setContent, handleSwap, handleShuffle, handleCopyAll]);

	return (
		<section className="flex h-[calc(100dvh-48px)] w-full flex-col overflow-hidden pb-14 lg:flex-row">
			{/* ── Stage: device-frame mock interface ───────────────────── */}
			<div
				role="img"
				aria-label={`Combos preview: ${c1Hex} background, ${c2Hex} sidebar, ${accent ?? "no"} accent`}
				className="relative flex h-96 w-full min-w-0 flex-col items-center justify-center overflow-hidden bg-background px-4 pb-8 pt-8 sm:h-[30rem] lg:h-full"
			>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage:
							"radial-gradient(circle, light-dark(rgba(0,0,0,0.13), rgba(255,255,255,0.09)) 1px, transparent 1px)",
						backgroundSize: "22px 22px",
					}}
				/>

				{/* macOS-style app window: the combo shown as a real product */}
				<div className="relative z-10 flex aspect-[16/11] w-full max-w-[560px] flex-col overflow-hidden rounded-[14px] border border-border shadow-xl shadow-black/15 dark:shadow-black/50">
					{/* Window chrome: traffic lights + title */}
					<div className="relative flex h-11 shrink-0 items-center gap-3 border-b border-border/80 bg-popover px-4">
						<div className="flex gap-[7px]">
							<span className="size-[11px] rounded-full bg-[#ff5f57]" />
							<span className="size-[11px] rounded-full bg-[#febc2e]" />
							<span className="size-[11px] rounded-full bg-[#28c840]" />
						</div>
						<span className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] font-medium text-foreground/80">
							Tokens — bicolor
						</span>
						<div className="ml-auto flex items-center rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground">
							v0.1.0
						</div>
					</div>

					<div className="flex min-h-0 flex-1">
						{/* Sidebar: secondary surface */}
						<div
							className="flex w-24 shrink-0 flex-col gap-0.5 border-r border-border/60 px-2.5 py-3"
							style={{ background: c2Hex }}
						>
							{[
									{ label: "Tokens", active: true },
									{ label: "Palettes", active: false },
									{ label: "Contrast", active: false },
									{ label: "Gradients", active: false },
								].map((item) => (
								<div
									key={item.label}
									className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 font-mono text-[9px] leading-none ${
										item.active
											? c2Ink === "black"
												? "bg-black/10 text-black"
												: "bg-white/15 text-white"
											: c2Ink === "black"
												? "text-black/70"
												: "text-white/75"
									}`}
								>
									<span
										className="size-1.5 shrink-0 rounded-full"
										style={{
											background: item.active ? (accent ?? "#fff") : "transparent",
										}}
									/>
									{item.label}
								</div>
							))}

							{/* Sidebar footer: user */}
							<div
								className={`mt-auto flex items-center gap-1.5 border-t px-1 pt-2 ${
									c2Ink === "black" ? "border-black/15" : "border-white/15"
								}`}
							>
								<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-black/20 font-mono text-[7px] font-bold text-white/90">
									BV
								</span>
								<div className="min-w-0 leading-tight">
									<p className={`font-mono text-[8px] leading-none ${c2Ink === "black" ? "text-black" : "text-white"}`}>
										bicolor
									</p>
									<p className={`mt-0.5 truncate font-mono text-[7px] leading-none ${c2Ink === "black" ? "text-black/60" : "text-white/65"}`}>
										harrow_roj
									</p>
								</div>
							</div>
						</div>

						{/* Content: dominant canvas with token rows */}
						<div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4" style={{ background: c1Hex }}>
							<p
								className={`font-mono text-[7px] uppercase tracking-[0.2em] ${
									c1Ink === "black" ? "text-black/60" : "text-white/65"
								}`}
							>
								Primitives
							</p>
							<div className="flex flex-col">
								{[
									{ name: "primary", value: c1Hex },
									{ name: "surface", value: c2Hex },
									{ name: "accent", value: accent ?? "#ffffff" },
								].map((row) => (
									<div
										key={row.name}
										className={`flex items-center justify-between gap-3 border-b px-1.5 py-2 ${
											c1Ink === "black" ? "border-black/15" : "border-white/15"
										}`}
									>
										<span className="flex items-center gap-2">
											<span
												className="size-4 shrink-0 rounded-sm border border-black/20"
												style={{ background: row.value }}
											/>
											<span className={`font-mono text-[9px] ${c1Ink === "black" ? "text-black" : "text-white"}`}>
												{row.name}
											</span>
										</span>
										<span className={`font-mono text-[9px] tabular-nums ${c1Ink === "black" ? "text-black/70" : "text-white/75"}`}>
											{row.value}
										</span>
									</div>
								))}
							</div>

							<p className={`font-mono text-[7px] uppercase tracking-[0.18em] ${c1Ink === "black" ? "text-black/50" : "text-white/50"}`}>
								Derived via {mode} · oklch
							</p>

							<button
								type="button"
								aria-label="Export theme"
								className="mt-auto inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-sm px-3.5 py-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.18em] shadow transition-transform duration-150 active:scale-[0.96]"
								style={{
									background: accent ?? "#ffffff",
									color: accentInk === "black" ? "#0a0a0a" : "#ffffff",
								}}
							>
								Export theme
								<ArrowRightIcon size={9} aria-hidden weight="bold" />
							</button>
						</div>
					</div>
				</div>

				{/* Hex chips — the trio at a glance */}
				<div className="relative z-10 mt-5 flex max-w-lg flex-wrap justify-center gap-2">
					{[
						{ key: "c1", value: c1Hex, label: label1?.name },
						{ key: "c2", value: c2Hex, label: label2?.name },
						{
							key: "accent",
							value: accent ?? "#ffffff",
							label: labelAccent?.name,
						},
					].map((chip) => (
						<button
							key={chip.key}
							type="button"
							onClick={() => copyText(chip.value, chip.key)}
							aria-label={`Copy ${chip.value}`}
							className="flex cursor-pointer flex-col items-start gap-0.5 rounded-md border px-2.5 py-1.5 transition-transform duration-150 active:scale-[0.97]"
							style={{
								borderColor: `${chip.value}66`,
								background: `${chip.value}14`,
							}}
						>
							<span className="flex items-center gap-1 font-mono text-[9px] font-bold tabular-nums"
								style={{ color: chip.value }}
							>
								#{chip.value.replace("#", "").toUpperCase()}
								{copied === chip.key ? (
									<CheckIcon size={9} aria-hidden />
								) : null}
							</span>
							<span className="font-mono text-[8px] uppercase text-muted-foreground/70">
								{chip.label ?? "—"}
							</span>
						</button>
					))}
				</div>

				{/* 60-30-10 readout */}
				<div className="relative z-10 mt-4 flex items-center gap-3">
					<Scale60_30_10 c1={c1Hex} c2={c2Hex} accent={accent} />
					<span className="font-mono text-[10px] tabular-nums text-muted-foreground">
						60 / 30 / 10
					</span>
				</div>
			</div>

			{/* ── Controls ───────────────────────────────────────────── */}
			<aside
				aria-label="Combos controls"
				className="flex min-h-0 w-full flex-1 flex-col border-t border-border/60 bg-background lg:h-full lg:w-[330px] lg:flex-none lg:border-l lg:border-t-0 xl:w-[340px]"
			>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{/* Header */}
					<div className="border-b border-border/60 px-4 py-4">
						<h1 className="font-mono text-2xl tracking-tight">combos</h1>
						<p className="mt-1 max-w-[32ch] font-mono text-[10px] leading-relaxed text-muted-foreground/60">
							Two dominants, one accent. Pick the harmony, keep the pair,
							steal the scheme.
						</p>
					</div>

					{/* Harmony */}
					<div className="border-b border-border/60 px-4 py-4">
						<SectionLabel>Harmony</SectionLabel>
						<div className="mt-2">
							<SegmentedControl<HarmonyMode>
								label="Harmony"
								value={mode}
								onValueChange={setMode}
								options={[
									{ value: "complementary", label: "Complementary" },
									{ value: "analogous", label: "Analogous" },
									{ value: "triadic", label: "Triadic" },
								]}
							/>
						</div>
					</div>

					{/* Dominants */}
					<div className="border-b border-border/60 px-4 py-4">
						<SectionLabel>Dominants</SectionLabel>
						<div className="mt-2 flex flex-col gap-2">
							<div className="flex items-center gap-2">
								<ColorSwatch
									color={c1Hex}
									size="sm"
									className="shrink-0 border border-border/60"
									aria-label={`Color 1 ${c1Hex}`}
								/>
								<ColorInput
									value={c1Value}
									model={c1Model}
									onValueChange={handleC1Change}
									onModelChange={handleC1ModelChange}
									inputAriaLabel="Dominant color value"
								/>
							</div>
							<div className="flex items-center gap-2">
								<ColorSwatch
									color={c2Hex}
									size="sm"
									className="shrink-0 border border-border/60"
									aria-label={`Color 2 ${c2Hex}`}
								/>
								<ColorInput
									value={c2Value}
									model={c2Model}
									onValueChange={handleC2Change}
									onModelChange={handleC2ModelChange}
									inputAriaLabel="Secondary color value"
								/>
							</div>
						</div>
					</div>

					{/* Accent */}
					<div className="border-b border-border/60 px-4 py-4">
						<div className="flex items-center justify-between gap-2">
							<SectionLabel>Accent</SectionLabel>
							<Button
								type="button"
								onClick={handleShuffle}
								aria-label="Shuffle palette"
								className="h-7 gap-1.5 px-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
							>
								<ShuffleIcon size={10} aria-hidden="true" />
								Shuffle
							</Button>
						</div>
						<div className="mt-2 flex items-center gap-2">
							<ColorSwatch
								color={accent ?? "#ffffff"}
								size="sm"
								className="shrink-0 border border-border/60"
								aria-label={`Accent ${accent ?? "unset"}`}
							/>
							<ColorInput
								value={accentValue}
								model={accentModel}
								onValueChange={handleAccentChange}
								onModelChange={handleAccentModelChange}
								inputAriaLabel="Accent color value"
								placeholder="Suggested accent"
							/>
						</div>
						<p className="mt-2 font-mono text-[9px] leading-relaxed text-muted-foreground/50">
							Derived from the first dominant via the selected harmony. Type
							over it to take manual control.
						</p>
					</div>

					{/* Named swatches */}
					<div className="border-b border-border/60 px-4 py-4">
						<SectionLabel>Nearest names</SectionLabel>
						<div className="mt-2 flex flex-col">
							{[
								{ role: "Dominant", hex: c1Hex, label: label1 },
								{ role: "Secondary", hex: c2Hex, label: label2 },
								{ role: "Accent", hex: accent ?? "", label: labelAccent },
							].map((row) => (
								<div
									key={row.role}
									className="flex items-center gap-3 border-b border-border/40 py-2 last:border-b-0"
								>
									<ColorSwatch
										color={row.hex}
										size="sm"
										className="shrink-0 border border-border/60"
										aria-label={`${row.role} swatch`}
									/>
									<div className="min-w-0 flex-1">
										<p className="font-mono text-[10px] leading-none text-foreground">
											{row.label?.name ?? "—"}
										</p>
										<p className="mt-1 truncate font-mono text-[9px] leading-none text-muted-foreground/60">
											{row.hex}
										</p>
									</div>
									<button
										type="button"
										onClick={() => copyText(row.hex, row.role)}
										aria-label={`Copy ${row.hex}`}
										className="shrink-0 cursor-pointer p-1 text-muted-foreground/50 outline-none transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring"
									>
										{copied === row.role ? (
											<CheckIcon size={12} aria-hidden />
										) : (
											<CopyIcon size={12} aria-hidden />
										)}
									</button>
								</div>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="px-4 py-4">
						<SectionLabel>Actions</SectionLabel>
						<div className="mt-2 flex flex-wrap gap-2">
							<Button
								type="button"
								onClick={handleReset}
								variant="secondary"
								className="h-8 font-mono text-[10px] uppercase tracking-wider active:scale-[0.96] transition-transform duration-150"
							>
								Reset
							</Button>
						</div>
					</div>
				</div>
			</aside>
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
