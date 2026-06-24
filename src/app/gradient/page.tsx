"use client";

import {
	Suspense,
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
} from "react";
import ColorSwatch from "@/components/ColorSwatch";
import { useActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { convert } from "@/lib/color";
import { MODELS, MODEL_LABELS, type ColorModel } from "@/lib/constants";
import { HexAlphaColorPicker } from "react-colorful";
import { sileo } from "sileo";
import {
	CopySimpleIcon,
	PlusCircleIcon,
	MinusCircleIcon,
	ArrowsLeftRightIcon,
	ArrowCounterClockwiseIcon,
	SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type GradientType = "linear" | "radial" | "angular" | "diamond";

const GRADIENT_TYPES: { value: GradientType; label: string }[] = [
	{ value: "linear", label: "Linear" },
	{ value: "radial", label: "Radial" },
	{ value: "angular", label: "Angular" },
	{ value: "diamond", label: "Diamond" },
];

let stopIdCounter = 2;
function nextStopId() {
	return String(++stopIdCounter);
}

interface GradientStop {
	id: string;
	color: string;
	position: number;
}

function GradientPageContent() {
	const { setContent } = useActionBar();

	const [type, setType] = useState<GradientType>("linear");
	const [colorModel, setColorModel] = useState<ColorModel>("hex");
	const [angle, setAngle] = useState(90);
	const [stops, setStops] = useState<GradientStop[]>([
		{ id: "1", color: "#6366f1", position: 0 },
		{ id: "2", color: "#f97316", position: 100 },
	]);
	const [openPickerId, setOpenPickerId] = useState<string | null>(null);
	const [outputTab, setOutputTab] = useState("css");
	const pickerRef = useRef<HTMLDivElement>(null);

	const sortedStops = useMemo(
		() => [...stops].sort((a, b) => a.position - b.position),
		[stops],
	);

	const gradientCSS = useMemo(() => {
		const parts = sortedStops.map((s) => `${s.color} ${s.position}%`);
		switch (type) {
			case "linear":
				return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
			case "radial":
				return `radial-gradient(circle, ${parts.join(", ")})`;
			case "angular":
				return `conic-gradient(from ${angle}deg, ${parts.join(", ")})`;
			case "diamond":
				return `radial-gradient(50% 50% at 50% 50%, ${parts.join(", ")})`;
		}
	}, [type, angle, sortedStops]);

	const diamondInnerCSS = useMemo(() => {
		if (type !== "diamond" || sortedStops.length < 2) return "";
		const inner = sortedStops
			.slice(0, -1)
			.map((s) => `${s.color} ${s.position}%`);
		return `radial-gradient(50% 50% at 50% 50%, ${inner.join(", ")}, transparent 100%)`;
	}, [type, sortedStops]);

	const diamondLastColor = useMemo(() => {
		if (type !== "diamond" || sortedStops.length === 0) return "";
		return sortedStops[sortedStops.length - 1].color;
	}, [type, sortedStops]);

	const gradientTW = useMemo(() => `bg-[${gradientCSS}]`, [gradientCSS]);

	const flipStops = useCallback(() => {
		setStops((prev) => {
			const maxPos = Math.max(...prev.map((s) => s.position));
			return prev.map((s) => ({
				...s,
				position: maxPos - s.position,
			}));
		});
	}, []);

	const addStop = useCallback(() => {
		const mid =
			sortedStops.length > 1
				? Math.round(
						(sortedStops[0].position +
							sortedStops[sortedStops.length - 1].position) /
							2,
					)
				: 50;
		const color =
			"#" +
			Math.floor(Math.random() * 0xffffff)
				.toString(16)
				.padStart(6, "0");
		setStops((prev) => [...prev, { id: nextStopId(), color, position: mid }]);
	}, [sortedStops]);

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
				s.id === id
					? { ...s, position: Math.max(0, Math.min(100, position)) }
					: s,
			),
		);
	}, []);

	const handleCopyCSS = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(`background: ${gradientCSS};`);
			sileo.success({ title: "CSS copied" });
		} catch {}
	}, [gradientCSS]);

	const handleCopyTW = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(gradientTW);
			sileo.success({ title: "Tailwind class copied" });
		} catch {}
	}, [gradientTW]);

	const handleCopyOutput = useCallback(async () => {
		const text =
			outputTab === "css" ? `background: ${gradientCSS};` : gradientTW;
		try {
			await navigator.clipboard.writeText(text);
			sileo.success({
				title: outputTab === "css" ? "CSS copied" : "Tailwind class copied",
			});
		} catch {}
	}, [outputTab, gradientCSS, gradientTW]);

	const reset = useCallback(() => {
		setType("linear");
		setAngle(90);
		setStops([
			{ id: "1", color: "#6366f1", position: 0 },
			{ id: "2", color: "#f97316", position: 100 },
		]);
	}, []);

	useEffect(() => {
		setContent(
			<div className="flex items-center gap-3">
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
					onClick={handleCopyCSS}
					className="text-background/60 hover:text-muted"
					aria-label="Copy gradient CSS"
				>
					<CopySimpleIcon size={14} />
					<span className="hidden md:inline">Copy CSS</span>
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={handleCopyTW}
					className="text-background/60 hover:text-muted"
					aria-label="Copy Tailwind class"
				>
					<CopySimpleIcon size={14} />
					<span className="hidden md:inline">Copy TW</span>
				</Button>
			</div>,
		);
		return () => setContent(null);
	}, [handleCopyCSS, handleCopyTW, reset, setContent]);

	return (
		<section className="min-h-[calc(100dvh-88px)] h-full w-full max-w-3xl m-auto flex flex-col p-4 gap-5 overflow-auto items-center justify-center">
			<div className="relative w-full h-48 md:h-56 rounded-sm border border-border overflow-hidden">
				{type === "diamond" ? (
					<div
						className="w-full h-full"
						style={{ backgroundColor: diamondLastColor }}
					>
						<div
							className="w-full h-full"
							style={{
								background: diamondInnerCSS,
								clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
							}}
						/>
					</div>
				) : (
					<div className="w-full h-full" style={{ background: gradientCSS }} />
				)}
			</div>

			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 w-full max-w-lg">
				<div className="flex items-center justify-between">
					<Select
						value={colorModel}
						onValueChange={(v) => setColorModel(v as ColorModel)}
					>
						<SelectTrigger
							className="w-fit font-mono text-xs h-7 px-2 gap-1"
							aria-label="Color model"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MODELS.map((m) => (
								<SelectItem
									key={m}
									value={m}
									className="font-mono text-xs cursor-pointer"
								>
									{MODEL_LABELS[m]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<button
						type="button"
						onClick={flipStops}
						className="sm:hidden p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
						aria-label="Flip gradient"
					>
						<ArrowsLeftRightIcon size={16} />
					</button>
				</div>
				<div className="flex items-center gap-1.5  justify-between flex-wrap sm:flex-1 sm:justify-center">
					{GRADIENT_TYPES.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => setType(t.value)}
							className={`px-3 py-1.5 text-xs font-mono rounded-sm border transition-colors cursor-pointer flex items-center gap-1.5 ${
								type === t.value
									? "border-ring text-foreground bg-muted/30"
									: "border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border"
							}`}
							aria-label={`${t.label} gradient`}
						>
							{t.label}
							{t.value === "diamond" && (
								<span className="text-[9px] px-1 py-px rounded-full bg-muted/50 text-muted-foreground/50 font-mono uppercase leading-none">
									Alpha
								</span>
							)}
						</button>
					))}
				</div>
				<button
					type="button"
					onClick={flipStops}
					className="hidden sm:flex p-1.5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
					aria-label="Flip gradient"
				>
					<ArrowsLeftRightIcon size={16} />
				</button>
			</div>

			<div
				className={`flex items-center gap-3 w-full max-w-lg ${type === "linear" || type === "angular" ? "" : "invisible pointer-events-none"}`}
			>
				<label className="text-xs font-mono text-muted-foreground/60 w-8 shrink-0">
					{angle}°
				</label>
				<div className="flex-1 relative pt-3 pb-1">
					<input
						type="range"
						min={0}
						max={360}
						step={5}
						value={angle}
						onChange={(e) => setAngle(Number(e.target.value))}
						className="w-full h-1.5 accent-foreground cursor-pointer"
						aria-label="Gradient angle"
						list="angle-marks"
					/>
					<datalist id="angle-marks">
						<option value={0} />
						<option value={45} />
						<option value={90} />
						<option value={135} />
						<option value={180} />
						<option value={225} />
						<option value={270} />
						<option value={315} />
						<option value={360} />
					</datalist>
					<div className="flex justify-between w-full px-[3px] -mt-0.5">
						{["0°", "", "90°", "", "180°", "", "270°", "", "360°"].map(
							(label, i) => (
								<span
									key={i}
									className={`text-[10px] font-mono ${label ? "text-muted-foreground/50" : "text-transparent"}`}
								>
									{label || "·"}
								</span>
							),
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between w-full max-w-lg">
				<span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
					Stops
				</span>
				<button
					type="button"
					onClick={addStop}
					className="flex items-center gap-1 text-xs font-mono text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
					aria-label="Add stop"
				>
					<PlusCircleIcon size={14} />
					<span>Add</span>
				</button>
			</div>

			<div className="w-full max-w-lg flex flex-col gap-2">
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
						onColorChange={(c) => updateStopColor(stop.id, c)}
						onPositionChange={(p) => updateStopPosition(stop.id, p)}
						onRemove={() => removeStop(stop.id)}
						canRemove={stops.length > 2}
						pickerRef={pickerRef}
					/>
				))}
			</div>

			<div className="w-full max-w-lg flex flex-col gap-1">
				<span className="text-xs font-mono text-muted-foreground/60 uppercase tracking-wider">
					Output
				</span>
				<Tabs
					defaultValue="css"
					onValueChange={setOutputTab}
					className="w-full"
				>
					<div className="flex items-center justify-between mb-2">
						<TabsList variant="line">
							<TabsTrigger value="css">CSS</TabsTrigger>
							<TabsTrigger value="tw">Tailwind</TabsTrigger>
						</TabsList>
						<Button
							variant="bare"
							size="xs"
							onClick={handleCopyOutput}
							aria-label="Copy code"
						>
							Copy
						</Button>
					</div>
					<TabsContent value="css">
						<pre className="p-3 rounded-sm bg-muted/30 border border-border whitespace-pre-wrap break-all text-muted-foreground font-mono text-xs leading-relaxed min-h-20">
							{"background: "}
							{gradientCSS}
						</pre>
					</TabsContent>
					<TabsContent value="tw">
						<pre className="p-3 rounded-sm bg-muted/30 border border-border whitespace-pre-wrap break-all text-muted-foreground font-mono text-xs leading-relaxed min-h-20">
							{gradientTW}
						</pre>
					</TabsContent>
				</Tabs>
			</div>
		</section>
	);
}

function StopRow({
	stop,
	index,
	colorModel,
	isPickerOpen,
	onTogglePicker,
	onClosePicker,
	onColorChange,
	onPositionChange,
	onRemove,
	canRemove,
	pickerRef,
}: {
	stop: GradientStop;
	index: number;
	colorModel: ColorModel;
	isPickerOpen: boolean;
	onTogglePicker: () => void;
	onClosePicker: () => void;
	onColorChange: (color: string) => void;
	onPositionChange: (pos: number) => void;
	onRemove: () => void;
	canRemove: boolean;
	pickerRef: React.RefObject<HTMLDivElement | null>;
}) {
	const [showTweak, setShowTweak] = useState(false);
	const hex = useMemo(
		() => convert(stop.color, "hex", "hex") ?? stop.color,
		[stop.color],
	);
	const displayColor = useMemo(
		() => convert(stop.color, "hex", colorModel) ?? stop.color,
		[stop.color, colorModel],
	);

	return (
		<div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-border/50 bg-muted/15">
			<div className="flex items-center gap-2 shrink-0">
				<span className="text-xs font-mono text-muted-foreground w-6">
					{index + 1}
				</span>
				<div className="relative">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onTogglePicker();
						}}
						className="shrink-0 cursor-pointer flex"
						aria-label={`Pick color for stop ${index + 1}`}
					>
						<ColorSwatch
							color={stop.color}
							size="sm"
							className="p-0.5 border border-border rounded-sm"
						/>
					</button>
					{isPickerOpen && (
						<>
							<div className="fixed inset-0 z-40" onPointerUp={onClosePicker} />
							<div
								ref={pickerRef}
								className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 p-1.5 border border-border rounded-xl bg-background shadow-lg"
								onPointerUp={onClosePicker}
							>
								<HexAlphaColorPicker
									color={hex}
									onChange={onColorChange}
									className="rounded-lg"
								/>
							</div>
						</>
					)}
				</div>
			</div>

			<input
				type="text"
				value={displayColor}
				onChange={(e) => {
					const hex = convert(e.target.value, colorModel, "hex");
					if (hex) onColorChange(hex);
				}}
				className="flex-1 min-w-0 h-8 bg-transparent border border-border rounded-sm px-2 font-mono text-xs text-foreground outline-none focus:border-ring transition-colors"
				spellCheck={false}
				aria-label={`Color value for stop ${index + 1}`}
			/>

			<div className="flex items-center gap-1 shrink-0">
				<div className="relative">
					<div className="flex items-center h-8 bg-transparent border border-border rounded-sm pl-1 pr-2 focus-within:border-ring transition-colors">
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setShowTweak((v) => !v);
							}}
							className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer p-0.5"
							aria-label="Scrub stop position"
						>
							<SlidersHorizontalIcon size={12} />
						</button>
						<input
							type="text"
							inputMode="numeric"
							value={String(stop.position)}
							onChange={(e) => {
								const val = e.target.value.replace(/^0+(?=\d)/, "");
								const num = val === "" ? 0 : Number(val);
								if (!isNaN(num)) onPositionChange(num);
							}}
							onBlur={() => {
								const clamped = Math.max(0, Math.min(100, stop.position));
								if (clamped !== stop.position) onPositionChange(clamped);
							}}
							className="w-14 h-full bg-transparent font-mono text-xs text-foreground text-center outline-none"
							aria-label={`Stop ${index + 1} position`}
						/>
					</div>
					{showTweak && (
						<>
							<div
								className="fixed inset-0 z-40"
								onPointerUp={() => setShowTweak(false)}
							/>
							<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 p-2.5 border border-border rounded-lg bg-background shadow-lg w-36">
								<input
									type="range"
									min={0}
									max={100}
									value={stop.position}
									onChange={(e) => onPositionChange(Number(e.target.value))}
									className="w-full h-1.5 accent-foreground cursor-pointer"
									aria-label="Stop position slider"
								/>
								<div className="flex justify-between text-[10px] font-mono text-muted-foreground/40 mt-0.5">
									<span>0%</span>
									<span>100%</span>
								</div>
							</div>
						</>
					)}
				</div>
				<span className="text-xs text-muted-foreground/60">%</span>
			</div>

			<button
				type="button"
				onClick={onRemove}
				disabled={!canRemove}
				className="shrink-0 text-muted-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
				aria-label={`Remove stop ${index + 1}`}
			>
				<MinusCircleIcon size={16} />
			</button>
		</div>
	);
}

export default function GradientPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
					Loading...
				</div>
			}
		>
			<GradientPageContent />
		</Suspense>
	);
}
