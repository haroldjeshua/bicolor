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
	suggestAccent,
	type HarmonyMode,
} from "@/lib/color";
import {
	ArrowRightIcon,
	CopyIcon,
	LinkSimpleIcon,
	ShuffleIcon,
} from "@phosphor-icons/react";
import { sileo } from "sileo";

const DEFAULT_C1 = "#6366f1";
const DEFAULT_C2 = "#f59e0b";

function CombosPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { setContent } = useActionBar();

	const [c1, setC1] = useState(() => searchParams.get("c1") ?? DEFAULT_C1);
	const [c2, setC2] = useState(() => searchParams.get("c2") ?? DEFAULT_C2);
	const [manualAccent, setManualAccent] = useState<string | null>(null);
	const [mode, setMode] = useState<HarmonyMode>(() => {
		const m = searchParams.get("mode");
		return m === "analogous" || m === "triadic" ? m : "complementary";
	});
	const [userEditedAccent, setUserEditedAccent] = useState(false);

	// Accent is auto-suggested from c1/c2/mode unless the user typed it.
	const accent = useMemo(
		() => (userEditedAccent ? manualAccent : suggestAccent(c1, c2, mode)),
		[c1, c2, mode, manualAccent, userEditedAccent],
	);

	const syncUrl = useCallback(() => {
		const params = new URLSearchParams();
		params.set("c1", c1);
		params.set("c2", c2);
		if (accent) params.set("accent", accent);
		params.set("mode", mode);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}, [c1, c2, accent, mode, router, pathname]);

	useEffect(() => {
		syncUrl();
	}, [c1, c2, accent, mode, syncUrl]);

	const handleC1Change = useCallback(
		(value: string) => {
			setC1(value);
			setUserEditedAccent(false);
		},
		[],
	);

	const handleC2Change = useCallback(
		(value: string) => {
			setC2(value);
			setUserEditedAccent(false);
		},
		[],
	);

	const handleAccentChange = useCallback(
		(value: string) => {
			setManualAccent(value);
			setUserEditedAccent(true);
		},
		[],
	);

	const handleModeChange = useCallback(
		(value: HarmonyMode) => {
			setMode(value);
			if (!userEditedAccent) setUserEditedAccent(false);
		},
		[userEditedAccent],
	);

	const handleShuffle = useCallback(() => {
		const random = () =>
			`#${Math.floor(Math.random() * 0xffffff)
				.toString(16)
				.padStart(6, "0")}`;
		const newC1 = random();
		setC1(newC1);
		setC2(suggestAccent(newC1, newC1, "analogous") ?? newC1);
		setUserEditedAccent(false);
	}, []);

	const handleSwap = useCallback(() => {
		setC1(c2);
		setC2(c1);
		setUserEditedAccent(false);
	}, [c1, c2]);

	const handleReset = useCallback(() => {
		setC1(DEFAULT_C1);
		setC2(DEFAULT_C2);
		setMode("complementary");
		setUserEditedAccent(false);
	}, []);

	const handleCopyAll = useCallback(async () => {
		const lines = [`# Combo colors`];
		if (c1) lines.push(`c1: ${c1}`);
		if (c2) lines.push(`c2: ${c2}`);
		if (accent) lines.push(`accent: ${accent}`);
		try {
			await navigator.clipboard.writeText(lines.join("\n"));
			sileo.success({
				title: "Copied combo colors",
				icon: <CopyIcon size={16} />,
			});
		} catch {}
	}, [c1, c2, accent]);

	// Label lookups via /names engine
	const label1 = useMemo(() => findClosestNamedColor(c1), [c1]);
	const label2 = useMemo(() => findClosestNamedColor(c2), [c2]);
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
					href={`${pathname}?c1=${encodeURIComponent(c1)}&c2=${encodeURIComponent(
						c2,
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
	}, [c1, c2, accent, mode, pathname, setContent, handleSwap, handleCopyAll]);

	return (
		<section className="min-h-[calc(100dvh-48px)] h-full w-full max-w-7xl m-auto flex flex-col px-4 pt-24 pb-32 gap-6 items-center justify-start">
			<div className="w-full max-w-2xl flex flex-col gap-4">
				<div className="flex items-center gap-3 w-full">
					<div className="relative flex items-center shrink-0">
						<ColorSwatch color={c1} size="sm" aria-label={`Color 1: ${c1}`} />
					</div>
					<div className="relative flex items-center shrink-0">
						<ColorSwatch color={c2} size="sm" aria-label={`Color 2: ${c2}`} />
					</div>
					<div className="relative flex items-center shrink-0">
						<ColorSwatch
							color={accent ?? "#ffffff"}
							size="sm"
							aria-label={`Accent: ${accent ?? "—"}`}
						/>
					</div>
				</div>

				<h1 className="font-mono text-2xl tracking-tight">combos</h1>
				<p className="max-w-2xl font-mono text-[10px] leading-relaxed text-muted-foreground/60">
					Two dominant colors, one accent. Preview a 60-30-10 scheme and
					label every swatch with its nearest established name.
				</p>

				{/* Harmony mode selector */}
				<div className="mt-2 flex items-center gap-3">
					<span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
						Harmony
					</span>
					<SegmentedControl<HarmonyMode>
						label="Harmony mode"
						value={mode}
						onValueChange={handleModeChange}
						options={[
							{ value: "complementary", label: "Complementary" },
							{ value: "analogous", label: "Analogous" },
							{ value: "triadic", label: "Triadic" },
						]}
					/>
				</div>

				{/* Color inputs */}
				<div className="mt-4 flex flex-col gap-3 w-full">
					<div className="flex items-center gap-3 w-full">
						<ColorInput
							value={c1}
							model="hex"
							onValueChange={handleC1Change}
							onModelChange={() => {}}
							inputAriaLabel="Dominant color value"
						/>
						<ColorInput
							value={c2}
							model="hex"
							onValueChange={handleC2Change}
							onModelChange={() => {}}
							inputAriaLabel="Secondary color value"
						/>
					</div>
					<div className="flex items-center gap-3 w-full">
						<ColorInput
							value={accent ?? ""}
							model="hex"
							onValueChange={handleAccentChange}
							onModelChange={() => {}}
							inputAriaLabel="Accent color value"
							placeholder="Suggested accent"
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

				{/* 60-30-10 preview mock UI */}
				<div className="mt-6 flex flex-col gap-4">
					<p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">
						60-30-10 preview
					</p>
					<div
						className="relative flex w-full max-w-2xl flex-col items-start gap-1 rounded-sm border border-border bg-background p-6 shadow-sm"
					>
						{/* Header band (c2, ~30% width) */}
						<div
							className="absolute top-0 left-0 h-8 rounded-t-sm"
							style={{ width: "30%", background: c2 }}
						/>
						{/* Main area (c1, 60%) */}
						<div
							className="flex-1 h-24 rounded-b-sm overflow-hidden relative"
							style={{ background: c1 }}
						>
							{/* Accent button (10%) */}
							<button
								type="button"
								aria-label="Accent action"
								className="absolute bottom-2 right-2 size-6 rounded-sm"
								style={{ background: accent ?? "#ffffff" }}
							/>
						</div>
						{/* Proportion labels */}
						<div className="absolute bottom-0 left-0 w-full flex justify-between px-2 pb-1">
							<span className="font-mono text-[9px] text-muted-foreground/60">
								{c1} · 60%
							</span>
							<span className="font-mono text-[9px] text-muted-foreground/60">
								{c2} · 30%
							</span>
							<span className="font-mono text-[9px] text-muted-foreground/60">
								{accent ?? "—"} · 10%
							</span>
						</div>
					</div>
				</div>

				{/* Labeled swatches */}
				<div className="mt-4 flex w-full justify-between gap-3">
					{[
						{
							key: "c1",
							color: c1,
							label: label1,
							role: "Dominant",
						},
						{
							key: "c2",
							color: c2,
							label: label2,
							role: "Secondary",
						},
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
									className="font-mono text-[9px] text-foreground truncate w-16"
									title={swatch.color}
								>
									{swatch.color}
								</span>
								{swatch.label ? (
									<span
										className="font-mono text-[8px] text-muted-foreground/60 truncate w-16"
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
