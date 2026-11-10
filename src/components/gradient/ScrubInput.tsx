"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

const round1 = (value: number) => Math.round(value * 10) / 10;

interface ScrubInputProps {
	value: number;
	min?: number;
	max?: number;
	step?: number;
	fineStep?: number;
	unitsPerPixel?: number;
	fineUnitsPerPixel?: number;
	onValueChange: (value: number) => void;
	ariaLabel: string;
	suffix?: string;
	icon: ReactNode;
	className?: string;
}

/**
 * A numeric field that can be edited directly or adjusted by dragging its
 * handle horizontally. Dragging is relative to where the pointer went down,
 * so the value never jumps; hold Shift for fine adjustments.
 */
export default function ScrubInput({
	value,
	min = 0,
	max = 100,
	step = 1,
	fineStep = 0.1,
	unitsPerPixel = 0.5,
	fineUnitsPerPixel = 0.05,
	onValueChange,
	ariaLabel,
	suffix,
	icon,
	className,
}: ScrubInputProps) {
	const [draft, setDraft] = useState<string | null>(null);
	const [dragging, setDragging] = useState(false);
	const dragRef = useRef<{ startX: number; startValue: number } | null>(null);

	const commit = useCallback(
		(raw: number) => {
			onValueChange(round1(clamp(raw, min, max)));
		},
		[onValueChange, min, max],
	);

	const beginDrag = useCallback(
		(event: React.PointerEvent<HTMLSpanElement>) => {
			if (event.button !== 0) return;
			event.preventDefault();
			try {
				event.currentTarget.setPointerCapture(event.pointerId);
			} catch {
				// pointer may not be active; dragging still works within the viewport
			}
			dragRef.current = { startX: event.clientX, startValue: value };
			setDragging(true);
			document.body.style.cursor = "ew-resize";
			document.body.style.userSelect = "none";
		},
		[value],
	);

	const onPointerMove = useCallback(
		(event: React.PointerEvent<HTMLSpanElement>) => {
			const drag = dragRef.current;
			if (!drag) return;

			const ratio = event.shiftKey ? fineUnitsPerPixel : unitsPerPixel;
			commit(drag.startValue + (event.clientX - drag.startX) * ratio);
		},
		[commit, fineUnitsPerPixel, unitsPerPixel],
	);

	const endDrag = useCallback(
		(event: React.PointerEvent<HTMLSpanElement>) => {
			if (!dragRef.current) return;
			dragRef.current = null;
			setDragging(false);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			try {
				event.currentTarget.releasePointerCapture(event.pointerId);
			} catch {
				// pointer already released
			}
		},
		[],
	);

	useEffect(
		() => () => {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		},
		[],
	);

	const nudge = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			let delta = 0;

			switch (event.key) {
				case "ArrowUp":
				case "ArrowRight":
					delta = event.shiftKey ? fineStep : step;
					break;
				case "ArrowDown":
				case "ArrowLeft":
					delta = event.shiftKey ? -fineStep : -step;
					break;
				case "Home":
					event.preventDefault();
					commit(min);
					return;
				case "End":
					event.preventDefault();
					commit(max);
					return;
				default:
					return;
			}

			event.preventDefault();
			commit(value + delta);
		},
		[commit, fineStep, max, min, step, value],
	);

	const display =
		draft !== null
			? draft
			: Number.isInteger(value)
				? String(value)
				: String(round1(value));

	return (
		<div
			className={cn(
				"flex h-8 items-stretch overflow-hidden border border-border/70 bg-muted/20 transition-colors focus-within:border-ring",
				className,
			)}
		>
			<span
				role="presentation"
				className={cn(
					"flex cursor-ew-resize touch-none select-none items-center px-1.5 transition-colors",
					dragging
						? "text-foreground"
						: "text-muted-foreground/60 hover:text-foreground",
				)}
				onPointerDown={beginDrag}
				onPointerMove={onPointerMove}
				onPointerUp={endDrag}
				onPointerCancel={endDrag}
			>
				{icon}
			</span>
			<input
				type="text"
				inputMode="decimal"
				aria-label={ariaLabel}
				value={display}
				autoComplete="off"
				spellCheck={false}
				className="w-full min-w-0 bg-transparent py-0 pr-1 text-right font-mono text-xs tabular-nums text-foreground outline-none"
				onFocus={(event) => {
					setDraft(String(round1(value)));
					event.currentTarget.select();
				}}
				onChange={(event) => {
					const raw = event.target.value;
					setDraft(raw);
					const parsed = Number(raw.trim());
					if (raw.trim() !== "" && !Number.isNaN(parsed)) commit(parsed);
				}}
				onBlur={() => setDraft(null)}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						event.currentTarget.blur();
						return;
					}
					nudge(event);
				}}
			/>
			{suffix && (
				<span className="flex items-center pr-2 font-mono text-[10px] text-muted-foreground/60">
					{suffix}
				</span>
			)}
		</div>
	);
}
