import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { DemoCards } from "@/components/DemoCards";
import { Footer } from "@/components/Footer";

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
		<>
			<section className="min-h-[calc(100dvh-88px)] flex flex-col items-center justify-center h-full px-4 gap-12 py-12">
				<div className="flex flex-col items-center justify-center gap-3">
					<Link href="/">
						<Logo className="size-24 inline-block" />
					</Link>
					<h1 className="font-mono text-2xl tracking-tight">bicolor</h1>
					<div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
						<Link
							href="/picker"
							className="hover:text-foreground transition-colors"
						>
							Pick
						</Link>
						<span className="text-muted-foreground/40">.</span>
						<Link
							href="/convert"
							className="hover:text-foreground transition-colors"
						>
							Convert
						</Link>
						<span className="text-muted-foreground/40">.</span>
						<Link
							href="/palette"
							className="hover:text-foreground transition-colors"
						>
							Palette
						</Link>
					</div>
					<p className="text-muted-foreground/40 text-sm font-mono text-center leading-relaxed">
						a direct, zero-overhead color tool for designers and developers
					</p>
				</div>

				<DemoCards />
			</section>

			<Footer />
		</>
	);
}
