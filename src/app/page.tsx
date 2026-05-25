import { Logo } from "@/components/Logo";
import Link from "next/link";

export default function Home() {
	return (
		<section className="min-h-[calc(100dvh-88px)] flex flex-col items-center justify-center h-full px-4 gap-8">
			<div className="flex flex-col items-center justify-center gap-1">
				<Logo className="size-32 inline-block" />
				<h1 className="font-mono text-2xl tracking-tight">bicolor</h1>
				<p className="text-muted-foreground text-sm font-mono">
					a direct, zero-overhead color tool for designers and developers
				</p>
			</div>

			<nav className="flex gap-6 text-sm font-mono">
				<Link href="/picker" className="text-foreground hover:underline">
					/picker
				</Link>
				<Link href="/convert" className="text-foreground hover:underline">
					/convert
				</Link>
				<Link href="/palette" className="text-foreground hover:underline">
					/palette
				</Link>
			</nav>
		</section>
	);
}
