import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { DemoCards } from "@/components/DemoCards";

export const metadata: Metadata = {
	title: "bicolor — Pick. Convert. Palette.",
	description:
		"Pick colors from a live color picker, convert between oklch/rgb/hsl/hex, and generate harmonious palettes.",
	openGraph: {
		title: "bicolor — Pick. Convert. Palette.",
		description:
			"A direct, zero-overhead color tool for designers and developers.",
	},
};

export default function Home() {
	return (
		<section className="min-h-[calc(100dvh-88px)] flex flex-col items-center justify-center h-full px-4 gap-12 py-12">
			<div className="flex flex-col items-center justify-center gap-1">
				<Logo className="size-24 inline-block" />
				<h1 className="font-mono text-2xl tracking-tight mt-2">bicolor</h1>
				<p className="text-muted-foreground text-sm font-mono">
					a direct, zero-overhead color tool for designers and developers
				</p>
			</div>

			<DemoCards />
		</section>
	);
}
