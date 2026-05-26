"use client";

import { Toaster } from "sileo";

export default function ThemeAwareToaster() {
	return (
		<Toaster
			position="top-center"
			offset={44}
			options={{
				fill: "var(--toast-fill)",
				roundness: 8,
				styles: {
					title: "text-[var(--toast-title)]! font-mono! text-xs!",
					badge: "bg-[var(--toast-badge-bg)]!",
					description: "text-background!",
				},
			}}
		/>
	);
}
