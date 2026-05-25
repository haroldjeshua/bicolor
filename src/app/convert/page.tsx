"use client";

import {
	Suspense,
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import ColorInput from "@/components/ColorInput";
import ColorSwatch from "@/components/ColorSwatch";
import ModelGrid from "@/components/ModelGrid";
import { useActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { convert } from "@/lib/color";
import { HexColorPicker } from "react-colorful";
import { SwapIcon } from "@phosphor-icons/react";
import { type ColorModel } from "@/lib/constants";

const DEFAULT_A_VALUE = "#1a2b3c";
const DEFAULT_A_MODEL: ColorModel = "hex";
const DEFAULT_B_MODEL: ColorModel = "oklch";

interface ConvertState {
	aValue: string;
	aModel: ColorModel;
	bValue: string;
	bModel: ColorModel;
}

function computeBValue(
	aValue: string,
	aModel: ColorModel,
	bModel: ColorModel,
): string {
	const result = convert(aValue, aModel, bModel);
	return result ?? "";
}

function ConvertPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();
	const { setContent } = useActionBar();

	const [state, setState] = useState<ConvertState>(() => {
		const from = searchParams.get("from");
		const value = searchParams.get("value");
		const to = searchParams.get("to");

		const aModel = (from as ColorModel) ?? DEFAULT_A_MODEL;
		const aValue = value ?? DEFAULT_A_VALUE;
		const bModel = (to as ColorModel) ?? DEFAULT_B_MODEL;
		const bValue = convert(aValue, aModel, bModel) ?? "";

		return { aValue, aModel, bValue, bModel };
	});

	const syncUrl = useCallback(
		(s: ConvertState) => {
			const params = new URLSearchParams();
			params.set("from", s.aModel);
			params.set("value", s.aValue);
			params.set("to", s.bModel);
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[router, pathname],
	);

	useEffect(() => {
		syncUrl(state);
	}, [state, syncUrl]);

	const [showPicker, setShowPicker] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);

	const pickerColor = useMemo(
		() => convert(state.aValue, state.aModel, "hex") ?? "#000000",
		[state.aValue, state.aModel],
	);

	useEffect(() => {
		if (!showPicker) return;
		const close = (e: MouseEvent) => {
			if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
				setShowPicker(false);
			}
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, [showPicker]);

	const handleSwap = useCallback(() => {
		setState((prev) => ({
			aValue: prev.bValue,
			aModel: prev.bModel,
			bValue: prev.aValue,
			bModel: prev.aModel,
		}));
	}, []);

	const handleColorPick = useCallback((hex: string) => {
		setState((prev) => {
			const newA = convert(hex, "hex", prev.aModel) ?? hex;
			const newB = computeBValue(newA, prev.aModel, prev.bModel);
			return { ...prev, aValue: newA, bValue: newB };
		});
	}, []);

	const handleShareUrl = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
		} catch {}
	}, []);

	const handleCopyResult = useCallback(async () => {
		const val = state.bValue;
		if (val) {
			try {
				await navigator.clipboard.writeText(val);
			} catch {}
		}
	}, [state]);

	useEffect(() => {
		setContent(
			<>
				<Button
					variant="bare"
					size="sm"
					onClick={handleSwap}
					aria-label="Swap inputs"
				>
					Swap
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={handleShareUrl}
					aria-label="Share URL"
				>
					Share
				</Button>
				<Button
					variant="bare"
					size="sm"
					onClick={handleCopyResult}
					aria-label="Copy result"
				>
					Copy result
				</Button>
			</>,
		);
		return () => setContent(null);
	}, [handleSwap, handleShareUrl, handleCopyResult, setContent]);

	const onAValueChange = useCallback((value: string) => {
		setState((prev) => {
			const newB = computeBValue(value, prev.aModel, prev.bModel);
			return { ...prev, aValue: value, bValue: newB };
		});
	}, []);

	const onAModelChange = useCallback((model: ColorModel) => {
		setState((prev) => {
			const newB = computeBValue(prev.aValue, model, prev.bModel);
			return { ...prev, aModel: model, bValue: newB };
		});
	}, []);

	const onBModelChange = useCallback((model: ColorModel) => {
		setState((prev) => {
			const newB = computeBValue(prev.aValue, prev.aModel, model);
			return { ...prev, bModel: model, bValue: newB };
		});
	}, []);

	return (
		<section className="min-h-[calc(100dvh-88px)] h-full w-full max-w-5xl m-auto flex flex-col p-4 gap-4 overflow-auto items-center justify-center">
			<div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-3xl">
				<div className="flex-1 flex items-center gap-3 w-full">
					<div className="relative flex items-center shrink-0">
						<button
							type="button"
							onClick={() => setShowPicker((p) => !p)}
							className="shrink-0 cursor-pointer h-9"
							aria-label="Pick a color"
						>
							<ColorSwatch color={state.aValue} size="sm" />
						</button>
						{showPicker && (
							<div
								ref={pickerRef}
								className="absolute top-full left-0 mt-2 z-50 p-1.5 border border-border rounded-xl bg-background"
							>
								<HexColorPicker
									color={pickerColor}
									onChange={handleColorPick}
									className="rounded-lg"
								/>
							</div>
						)}
					</div>
					<div className="flex-1 min-w-0">
						<ColorInput
							value={state.aValue}
							model={state.aModel}
							onValueChange={onAValueChange}
							onModelChange={onAModelChange}
						/>
					</div>
				</div>

				<Button
					variant="bare"
					size="default"
					className="border-border h-9"
					onClick={handleSwap}
					aria-label="Swap inputs"
				>
					<SwapIcon size={16} weight="regular" />
				</Button>

				<div className="flex-1 flex items-center gap-3 w-full">
					<div className="flex-1 min-w-0">
						<ColorInput
							value={state.bValue}
							model={state.bModel}
							onValueChange={() => {}}
							onModelChange={onBModelChange}
							readonly
							hideOptions={[state.aModel]}
						/>
					</div>
				</div>
			</div>

			<div className="w-full max-w-2xl mt-8">
				<ModelGrid value={state.aValue} model={state.aModel} />
			</div>
		</section>
	);
}

export default function ConvertPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
					Loading...
				</div>
			}
		>
			<ConvertPageContent />
		</Suspense>
	);
}
