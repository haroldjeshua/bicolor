import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { ToolGrid } from "@/components/landing/ToolGrid";

export const metadata: Metadata = {
	title: "bicolor — pick. convert. contrast. palette. gradient. names.",
	description:
		"Six zero-overhead color tools: pick, convert, check WCAG contrast, build palettes, design gradients, and name colors — all URL-shareable.",
	openGraph: {
		title: "bicolor — pick. convert. contrast. palette. gradient. names.",
		description:
			"Six zero-overhead color tools. One job per page. All URL-shareable.",
	},
};

export default function Home() {
	return (
		<>
			<section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
				<div className="flex flex-wrap items-end justify-between gap-6 border-b border-border/60 pb-6 sm:pb-8">
					<div className="flex items-center gap-4 sm:gap-5">
						<Link href="/" aria-label="bicolor — home">
							<Logo className="h-12 w-auto sm:h-14" />
						</Link>
						<div>
							<h1 className="font-mono text-2xl tracking-tight sm:text-3xl">
								bicolor
							</h1>
							<p className="mt-1 max-w-md font-mono text-[10px] leading-relaxed text-muted-foreground/60 sm:text-[11px]">
								a deadsimple, zero-overhead color tool for designers and
								developers
							</p>
						</div>
					</div>
					<p className="hidden text-right font-mono text-[9px] uppercase leading-loose tracking-[0.2em] text-muted-foreground/45 md:block">
						six tools
						<br />
						url-shareable
						<br />
						oklch-native
					</p>
				</div>

				<ToolGrid />
			</section>

			<Footer />
		</>
	);
}
