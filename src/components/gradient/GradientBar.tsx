"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { GradientStop } from "./types";

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

interface GradientBarProps {
	/** Stops, already sorted by position. */
	stops: readonly GradientStop[];
	/** The full gradient declaration, used to paint the track. */
	gradientCSS: string;
	onPositionChange: (id: string, position: number) => void;
	onAddStop: (position: number) => void;
}

/**
 * A gradient strip with a draggable handle per stop. Dragging is relative —
 * the value moves by the pointer's delta, never snapping to the cursor.
 * Clicking the track inserts a stop at that position.
 */
export default function GradientBar({
	stops,
	gradientCSS,
	onPositionChange,
	onAddStop,
}: GradientBarProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [draggingId, setDraggingId] = useState<string | null>(null);

	const positionFromEvent = useCallback((clientX: number) => {
		const track = trackRef.current;
		if (!track) return null;

		const rect = track.getBoundingClientRect();
		if (rect.width === 0) return null;

		return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
	}, []);

	const beginDrag = useCallback(
		(event: React.PointerEvent<HTMLButtonElement>, id: string) => {
			if (event.button !== 0) return;

			event.preventDefault();
			event.stopPropagation();
			try {
				event.currentTarget.setPointerCapture(event.pointerId);
			} catch {
				// pointer may not be active; dragging still works within the viewport
			}
			setDraggingId(id);
			document.body.style.cursor = "ew-resize";
			document.body.style.userSelect = "none";
		},
		[],
	);

	const onPointerMove = useCallback(
		(event: React.PointerEvent<HTMLButtonElement>) => {
			const position = positionFromEvent(event.clientX);
			if (position === null) return;

			const dragId = event.currentTarget.dataset.stopId;
			if (dragId) onPositionChange(dragId, position);
		},
		[onPositionChange, positionFromEvent],
	);

	const endDrag = useCallback(
		(event: React.PointerEvent<HTMLButtonElement>) => {
			if (!draggingId) return;

			setDraggingId(null);
			document.body.style.cursor = "";
			document.body.style.userSelect = "";

			try {
				event.currentTarget.releasePointerCapture(event.pointerId);
			} catch {
				// pointer already released
			}
		},
		[draggingId],
	);

	useEffect(
		() => () => {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
		},
		[],
	);

	const nudge = useCallback(
		(event: React.KeyboardEvent<HTMLButtonElement>, stop: GradientStop) => {
			let delta = 0;

			switch (event.key) {
				case "ArrowLeft":
					delta = event.shiftKey ? -10 : -1;
					break;
				case "ArrowRight":
					delta = event.shiftKey ? 10 : 1;
					break;
				case "Home":
					event.preventDefault();
					onPositionChange(stop.id, 0);
					return;
				case "End":
					event.preventDefault();
					onPositionChange(stop.id, 100);
					return;
				default:
					return;
			}

			event.preventDefault();
			onPositionChange(stop.id, clamp(stop.position + delta, 0, 100));
		},
		[onPositionChange],
	);

	const addStop = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const position = positionFromEvent(event.clientX);
			if (position !== null) onAddStop(position);
		},
		[onAddStop, positionFromEvent],
	);

	return (
		<div className="relative h-9 w-full select-none">
			{/* track */}
			<div
				ref={trackRef}
				role="presentation"
				className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 cursor-copy touch-none rounded-full border border-border/70 shadow-[inset_0_1px_1px_rgb(0_0_0_/_0.18)]"
				style={{ background: gradientCSS }}
				onPointerDown={addStop}
			/>

			{/* handles */}
			{stops.map((stop) => {
				const isDragging = draggingId === stop.id;

				return (
					<button
						key={stop.id}
						type="button"
						role="slider"
						tabIndex={0}
						data-stop-id={stop.id}
						aria-label={`Stop with color ${stop.color} at ${Math.round(
							stop.position,
						)} percent`}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(stop.position)}
						aria-valuetext={`${Math.round(stop.position)} percent`}
						className="absolute top-1/2 z-10 flex h-7 w-6 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center outline-none"
						style={{ left: `${stop.position}%` }}
						onPointerDown={(event) => beginDrag(event, stop.id)}
						onPointerMove={onPointerMove}
						onPointerUp={endDrag}
						onPointerCancel={endDrag}
						onKeyDown={(event) => nudge(event, stop)}
					>
						<span
							className={cn(
								"block size-5 rounded-full border-2 border-background shadow-sm transition-[transform,background-color] duration-150",
								"hover:scale-110 focus-visible:scale-110",
								"focus-visible:ring-2 focus-visible:ring-ring",
								isDragging && "scale-125",
							)}
							style={{ background: stop.color }}
						/>
					</button>
				);
			})}
		</div>
	);
}
