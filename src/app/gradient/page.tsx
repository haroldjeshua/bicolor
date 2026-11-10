"use client";

import {
	Suspense,
	useState,
	useCallback,
	useEffect,
	useMemo,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import GradientSaveDialog from "@/components/GradientSaveDialog";
import ExportPanel from "@/components/gradient/ExportPanel";
import { useActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { mixColors, convert } from "@/lib/color";
import { MODELS, MODEL_LABELS, type ColorModel } from "@/lib/constants";
import {
	PlusCircleIcon,
	ArrowsLeftRightIcon,
	ArrowCounterClockwiseIcon,
	ShuffleIcon,
	BookmarkSimpleIcon,
	CompassIcon,
	LineVerticalIcon,
	TargetIcon,
	ChartPieIcon,
	ExportIcon,
	CircleHalfIcon,
} from "@phosphor-icons/react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import GradientBar from "@/components/gradient/GradientBar";
import StopRow from "@/components/gradient/StopRow";
import ScrubInput from "@/components/gradient/ScrubInput";
import type { GradientStop, GradientType } from "@/components/gradient/types";

const GRADIENT_TYPES: {
	value: GradientType;
	label: string;
	icon: typeof LineVerticalIcon;
}[] = [
	{ value: "linear", label: "Linear", icon: LineVerticalIcon },
	{ value: "radial", label: "Radial", icon: TargetIcon },
	{ value: "angular", label: "Angular", icon: ChartPieIcon },
];

const DEFAULT_STOPS = [
	{ id: "1", color: "#6366f1", position: 0 },
	{ id: "2", color: "#f97316", position: 100 },
] satisfies GradientStop[];

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
			{children}
		</span>
	);
}

function parseStopsFromParams(params: URLSearchParams): GradientStop[] | null {
	const raw = params.get("stops");
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length < 2) return null;
		return parsed.map((s: Record<string, unknown>, i: number) => ({
			id: String(i + 1),
			color: typeof s.color === "string" ? s.color : "#6366f1",
			position:
				typeof s.position === "number"
					? Math.max(0, Math.min(100, s.position))
					: 50,
		}));
	} catch {
		return null;
	}
}

const clampPosition = (value: number) => Math.max(0, Math.min(100, value));

/** Stop ids are numeric strings, so the next id is always one past the max. */
const nextStopId = (existing: readonly GradientStop[]) =>
	String(Math.max(0, ...existing.map((s) => Number(s.id) || 0)) + 1);

function GradientPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { setContent } = useActionBar();

	const [type, setType] = useState<GradientType>(() => {
		const t = searchParams.get("type");
		if (t && GRADIENT_TYPES.some((gt) => gt.value === t)) return t as GradientType;
		return "linear";
	});
	const [colorModel, setColorModel] = useState<ColorModel>(() => {
		const m = searchParams.get("model");
		if (m && MODELS.includes(m as ColorModel)) return m as ColorModel;
		return "hex";
	});
	const [angle, setAngle] = useState(() => {
		const a = searchParams.get("angle");
		const n = a ? Number(a) : NaN;
		return !isNaN(n) ? Math.max(0, Math.min(360, n)) : 90;
	});
	const [stops, setStops] = useState<GradientStop[]>(() => {
		const fromUrl = parseStopsFromParams(searchParams);
		if (fromUrl) {
			return fromUrl;
		}
		return DEFAULT_STOPS;
	});

	const [openPickerId, setOpenPickerId] = useState<string | null>(null);
	const [exportOpen, setExportOpen] = useState(false);
	const [saveOpen, setSaveOpen] = useState(false);

	const sortedStops = useMemo(
		() => [...stops].sort((a, b) => a.position - b.position),
		[stops],
	);

	const gradientCSS = useMemo(() => {
		const serializeStop = (color: string) =>
			convert(color, "hex", colorModel) ?? color;
		const parts = sortedStops.map(
			(s) => `${serializeStop(s.color)} ${s.position}%`,
		);
		switch (type) {
			case "linear":
				return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
			case "radial":
				return `radial-gradient(circle, ${parts.join(", ")})`;
			case "angular":
				return `conic-gradient(from ${angle}deg, ${parts.join(", ")})`;
		}
	}, [type, angle, sortedStops, colorModel]);

	const gradientTW = useMemo(() => `bg-[${gradientCSS}]`, [gradientCSS]);

	const gradientUrl = useMemo(() => {
		const p = new URLSearchParams();
		p.set("type", type);
		p.set("angle", String(angle));
		p.set("model", colorModel);
		p.set("stops", JSON.stringify(stops.map((s) => ({ color: s.color, position: s.position }))));
		return `/gradient?${p.toString()}`;
	}, [type, angle, colorModel, stops]);

	const gradientContrastUrl = useMemo(() => {
		const p = new URLSearchParams();
		p.set("mode", "gradient");
		p.set("angle", String(angle));
		p.set("stops", JSON.stringify(stops.map((s) => ({ color: s.color, position: s.position }))));
		return `/contrast?${p.toString()}`;
	}, [angle, stops]);

	useEffect(() => {
		const p = new URLSearchParams();
		p.set("type", type);
		p.set("angle", String(angle));
		p.set("model", colorModel);
		p.set(
			"stops",
			JSON.stringify(stops.map((s) => ({ color: s.color, position: s.position }))),
		);
		router.replace(`${pathname}?${p.toString()}`, { scroll: false });
	}, [type, angle, colorModel, stops, router, pathname]);

	const flipStops = useCallback(() => {
		setStops((prev) =>
			prev.map((s) => ({ ...s, position: 100 - s.position })),
		);
	}, []);

	/** Color that would sit between two neighboring stops. */
	const interpolatedColor = useCallback(
		(position: number) => {
			const before = [...sortedStops]
				.reverse()
				.find((s) => s.position <= position);
			const after = sortedStops.find((s) => s.position >= position);

			if (before && after && before.id !== after.id) {
				const t =
					(position - before.position) /
					Math.max(after.position - before.position, 1e-6);
				const mixed = mixColors(before.color, after.color, t);
				if (mixed) return mixed;
			}

			return before?.color ?? after?.color ?? "#6366f1";
		},
		[sortedStops],
	);

	/** Insert a stop at an arbitrary position, colored to match the gradient there. */
	const addStopAt = useCallback(
		(position: number) => {
			const clamped = clampPosition(Math.round(position * 10) / 10);
			setStops((prev) => [
				...prev,
				{
					id: nextStopId(prev),
					color: interpolatedColor(clamped),
					position: clamped,
				},
			]);
		},
		[interpolatedColor],
	);

	/** Split the widest gap in the gradient with a new stop. */
	const addStop = useCallback(() => {
		const positions = [...new Set(sortedStops.map((s) => s.position))].sort(
			(a, b) => a - b,
		);

		let bestStart = 0;
		let widestGap = positions[0] ?? 100;

		for (let i = 0; i < positions.length - 1; i += 1) {
			const gap = positions[i + 1] - positions[i];
			if (gap > widestGap) {
				widestGap = gap;
				bestStart = positions[i];
			}
		}

		const end = positions.find((p) => p > bestStart) ?? 100;
		addStopAt((bestStart + end) / 2);
	}, [addStopAt, sortedStops]);

	const removeStop = useCallback((id: string) => {
		setStops((prev) => {
			if (prev.length <= 2) return prev;
			return prev.filter((s) => s.id !== id);
		});
	}, []);

	const updateStopColor = useCallback((id: string, color: string) => {
		setStops((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
	}, []);

	const updateStopPosition = useCallback((id: string, position: number) => {
		setStops((prev) =>
			prev.map((s) =>
				s.id === id ? { ...s, position: clampPosition(position) } : s,
			),
		);
	}, []);

	const reset = useCallback(() => {
		setType("linear");
		setAngle(90);
		setStops([
			{ id: "1", color: "#6366f1", position: 0 },
			{ id: "2", color: "#f97316", position: 100 },
		]);
	}, []);

	const shuffle = useCallback(() => {
		const types: GradientType[] = ["linear", "radial", "angular"];
		const newType = types[Math.floor(Math.random() * types.length)];
		const newAngle = Math.round(Math.random() * 360 / 5) * 5;
		const stopCount = 2 + Math.floor(Math.random() * 4);
		const positions = Array.from({ length: stopCount }, () =>
			Math.round(Math.random() * 100),
		).sort((a, b) => a - b);
		positions[0] = 0;
		positions[stopCount - 1] = 100;

		setType(newType);
		setAngle(newAngle);
		setStops((prev) => {
			const base = Math.max(0, ...prev.map((s) => Number(s.id) || 0)) + 1;
			return positions.map((p, i) => {
				const hex =
					"#" +
					Math.floor(Math.random() * 0xffffff)
						.toString(16)
						.padStart(6, "0");
				return { id: String(base + i), color: hex, position: p };
			});
		});
	}, []);

	useEffect(() => {
		setContent(
			<div className="flex items-center gap-3">
				<Button
					variant="bare"
					size="sm"
					onClick={shuffle}
					className="text-background/60 hover:text-muted"
					aria-label="Shuffle gradient"
				>
					<ShuffleIcon size={14} />
					<span className="hidden md:inline">Shuffle</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={reset}
					className="text-background/60 hover:text-muted"
					aria-label="Reset gradient"
				>
					<ArrowCounterClockwiseIcon size={14} />
					<span className="hidden md:inline">Reset</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={() => setExportOpen((v) => !v)}
					className="text-background/60 hover:text-muted"
					aria-label="Export gradient"
					aria-expanded={exportOpen}
				>
					<ExportIcon size={14} />
					<span className="hidden md:inline">Export</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={() => setSaveOpen(true)}
					className="text-background/60 hover:text-muted"
					aria-label="Save gradient"
				>
					<BookmarkSimpleIcon size={14} />
					<span className="hidden md:inline">Save</span>
				</Button>

				{type === "linear" ? (
					<Button
						variant="bare"
						size="sm"
						asChild
						className="text-background/60 hover:text-muted"
					>
						<Link href={gradientContrastUrl} aria-label="Check contrast of this gradient">
							<CircleHalfIcon size={14} />
							<span className="hidden md:inline">Check contrast</span>
						</Link>
					</Button>
				) : (
					<Button
						variant="bare"
						size="sm"
						disabled
						title="Check contrast is available for linear gradients only"
						aria-label="Check contrast (linear gradients only)"
						className="text-background/30"
					>
						<CircleHalfIcon size={14} />
						<span className="hidden md:inline">Check contrast</span>
					</Button>
				)}
			</div>,
		);
		return () => setContent(null);
	}, [reset, shuffle, setContent, exportOpen, gradientContrastUrl, type]);

	const showAngle = type === "linear" || type === "angular";

	return (
		<>
		<section className="flex h-[calc(100dvh-48px)] w-full flex-col overflow-hidden pb-16 lg:flex-row">
			{/* Stage: the gradient is the body, not a thumbnail */}
			<div
				role="img"
				aria-label={`Gradient preview: ${gradientCSS}`}
				className="relative h-56 w-full shrink-0 overflow-hidden bg-muted/20 sm:h-64 lg:h-full lg:min-w-0 lg:flex-1"
			>
				<div
					className="absolute inset-0"
					style={{ background: gradientCSS }}
				/>
			</div>

			{/* Side panel: controls + export, like a design tool */}
			<aside
				aria-label="Gradient controls"
				className="flex min-h-0 w-full flex-1 flex-col border-t border-border/60 bg-background lg:w-[330px] lg:flex-none lg:border-l lg:border-t-0 xl:w-[340px]"
			>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{/* Type */}
					<div className="border-b border-border/60 px-4 py-4">
						<SectionLabel>Type</SectionLabel>
						<div
							role="group"
							aria-label="Gradient type"
							className="mt-2 grid grid-cols-3 border border-border/70 bg-muted/20 p-1"
						>
							{GRADIENT_TYPES.map((t) => (
								<button
									key={t.value}
									type="button"
									onClick={() => setType(t.value)}
									aria-pressed={type === t.value}
									className={`flex h-9 cursor-pointer items-center justify-center gap-1.5 px-2 font-mono text-[11px] leading-none transition-colors active:scale-[0.97] ${
										type === t.value
											? "bg-foreground text-background"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<t.icon size={14} aria-hidden weight="regular" />
									{t.label}
								</button>
							))}
						</div>

						{showAngle && (
							<div className="mt-3">
								<div className="mb-1.5 flex items-center justify-between">
									<SectionLabel>Angle</SectionLabel>
								</div>
								<ScrubInput
									value={angle}
									min={0}
									max={360}
									step={5}
									fineStep={1}
									unitsPerPixel={1.8}
									fineUnitsPerPixel={0.18}
									onValueChange={(value) => setAngle(Math.round(value))}
									ariaLabel="Gradient angle"
									suffix="°"
									icon={<CompassIcon size={12} aria-hidden />}
									className="w-full"
								/>
							</div>
						)}
					</div>

					{/* Stops */}
					<div className="border-b border-border/60 px-4 py-4">
						<div className="flex items-center justify-between">
							<SectionLabel>Stops</SectionLabel>
							<div className="flex items-center gap-1">
								<Select
									value={colorModel}
									onValueChange={(value) =>
										setColorModel(value as ColorModel)
									}
								>
									<SelectTrigger
										className="h-7 w-fit gap-1 px-2 font-mono text-[11px]"
										aria-label="Color model"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{MODELS.map((m) => (
											<SelectItem
												key={m}
												value={m}
												className="cursor-pointer font-mono text-[11px]"
											>
												{MODEL_LABELS[m]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<button
									type="button"
									onClick={flipStops}
									className="flex size-7 cursor-pointer items-center justify-center text-muted-foreground/60 transition-colors hover:text-foreground"
									aria-label="Flip gradient"
									title="Flip gradient"
								>
									<ArrowsLeftRightIcon size={14} aria-hidden />
								</button>
								<button
									type="button"
									onClick={addStop}
									className="flex h-7 cursor-pointer items-center gap-1 px-1.5 font-mono text-[11px] text-muted-foreground/60 transition-colors hover:text-foreground"
									aria-label="Add stop"
								>
									<PlusCircleIcon size={14} aria-hidden />
									Add
								</button>
							</div>
						</div>

						<div className="mt-2">
							<GradientBar
								stops={sortedStops}
								gradientCSS={gradientCSS}
								onPositionChange={updateStopPosition}
								onAddStop={addStopAt}
							/>
						</div>

						<div className="mt-2 flex flex-col gap-1.5">
							{sortedStops.map((stop, i) => (
								<StopRow
									key={stop.id}
									stop={stop}
									index={i}
									colorModel={colorModel}
									isPickerOpen={openPickerId === stop.id}
									onTogglePicker={() =>
										setOpenPickerId(openPickerId === stop.id ? null : stop.id)
									}
									onClosePicker={() => setOpenPickerId(null)}
									onColorChange={(color) => updateStopColor(stop.id, color)}
									onPositionChange={(position) =>
										updateStopPosition(stop.id, position)
									}
									onRemove={() => removeStop(stop.id)}
									canRemove={stops.length > 2}
								/>
							))}
						</div>

						<p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground/50">
							Click the gradient strip to insert a stop at that position.
						</p>
					</div>
				</div>

			</aside>

			<GradientSaveDialog
				open={saveOpen}
				onOpenChange={setSaveOpen}
				type={type}
				angle={angle}
				gradientCSS={gradientCSS}
				url={gradientUrl}
			/>
		</section>

		<ExportPanel
			open={exportOpen}
			onOpenChange={setExportOpen}
			gradientCSS={gradientCSS}
			gradientTW={gradientTW}
		/>
		</>
	);
}

export default function GradientPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-full items-center justify-center font-mono text-sm text-muted-foreground">
					Loading...
				</div>
			}
		>
			<GradientPageContent />
		</Suspense>
	);
}
