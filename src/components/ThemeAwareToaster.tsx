"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sileo";

export default function ThemeAwareToaster() {
	const { resolvedTheme } = useTheme();
	const fill = resolvedTheme === "dark" ? "#f4f4f5" : "#18181b";
	const titleClass =
		resolvedTheme === "dark" ? "text-zinc-800! font-mono! text-xs!" : "text-white! font-mono! text-xs!";

	return (
		<Toaster
			position="top-center"
			offset={56}
			options={{
				fill,
				roundness: 8,
				styles: {
					title: titleClass,
					badge: "bg-black/10!",
				},
			}}
		/>
	);
}
