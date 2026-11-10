"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Logo } from "./Logo";
import {
	DotsThreeVerticalIcon,
	EqualsIcon,
	MoonStarsIcon,
	SunDimIcon,
} from "@phosphor-icons/react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
	{ href: "/picker", label: "picker" },
	{ href: "/convert", label: "convert" },
	{ href: "/palette", label: "palette" },
	{ href: "/gradient", label: "gradient" },
	{ href: "/names", label: "names" },
	{ href: "/saved", label: "saved" },
] as const;

export default function Header() {
	const pathname = usePathname();
	const { setTheme, resolvedTheme } = useTheme();
	const [menuOpen, setMenuOpen] = useState(false);
	const [aboutOpen, setAboutOpen] = useState(false);
	const [wipOpen, setWipOpen] = useState(false);

	const toggleDark = () =>
		setTheme(resolvedTheme === "dark" ? "light" : "dark");

	useEffect(() => {
		if (!menuOpen) return;
		const close = () => setMenuOpen(false);
		document.addEventListener("click", close);
		return () => document.removeEventListener("click", close);
	}, [menuOpen]);

	const isActive = (href: string) => pathname.startsWith(href);

	return (
		<header className="fixed top-0 left-0 right-0 h-12 border-b bg-background flex items-center px-4 md:px-6 z-50">
			<div className="grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] w-full items-center">
				<Link
					href="/"
					className="justify-self-start font-mono text-sm tracking-tight text-foreground hover:text-muted-foreground transition-colors"
				>
					<Logo className="h-4 inline-block" />
					<span>bicolor</span>
				</Link>

				<nav className="hidden md:flex items-center justify-center gap-5 lg:gap-8">
					{NAV_ITEMS.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`font-mono text-xs tracking-wide uppercase transition-colors ${
								isActive(item.href)
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<span
								className={isActive(item.href) ? "" : "invisible"}
								aria-hidden="true"
							>
								/
							</span>
							{item.label}
						</Link>
					))}
				</nav>

				<div className="flex items-center justify-self-end gap-6">
					<button
						onClick={toggleDark}
						className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						aria-label="Toggle dark mode"
					>
						<span className="hidden dark:inline">
							<SunDimIcon />
						</span>
						<span className="dark:hidden">
							<MoonStarsIcon />
						</span>
					</button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="cursor-pointer font-mono text-xs tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
								<span>More</span>
								<DotsThreeVerticalIcon className="ml-0.5" size={16} />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="end"
							className="min-w-40 font-mono text-xs"
						>
							<DropdownMenuItem onSelect={() => setAboutOpen(true)}>
								About
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => setWipOpen(true)}>
								WIP
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<a
									href="https://github.com/haroldjeshua/bicolor"
									target="_blank"
									rel="noopener noreferrer"
								>
									GitHub
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<a
									href="https://x.com/haroldvarde"
									target="_blank"
									rel="noopener noreferrer"
								>
									X / Twitter
								</a>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<a
									href="mailto:hello@harv.computer"
									target="_blank"
									rel="noopener noreferrer"
								>
									Contact
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<a
									href="mailto:hello@harv.computer?subject=Bicolor%20Feedback"
									target="_blank"
									rel="noopener noreferrer"
								>
									Feedback
								</a>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<a
									href="https://buymeacoffee.com/haroldjeshua"
									target="_blank"
									rel="noopener noreferrer"
								>
									Buy me a coffee
								</a>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<button
						onClick={(e) => {
							e.stopPropagation();
							setMenuOpen((p) => !p);
						}}
						className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors md:invisible md:pointer-events-none"
						aria-label="Toggle navigation menu"
					>
						<EqualsIcon />
					</button>
				</div>
			</div>

			{menuOpen && (
				<div
					className="absolute top-12 left-0 right-0 bg-background border-b md:hidden"
					onClick={(e) => e.stopPropagation()}
				>
					{NAV_ITEMS.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => setMenuOpen(false)}
							className={`block px-4 py-2 font-mono text-xs tracking-wide uppercase transition-colors ${
								isActive(item.href)
									? "text-foreground bg-muted"
									: "text-muted-foreground hover:text-foreground hover:bg-muted"
							}`}
						>
							{item.label}
						</Link>
					))}
				</div>
			)}

			<Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>bicolor</DialogTitle>
						<DialogDescription>
							A deadsimple, zero-overhead color tool for design engineers. Pick
							colors, convert between oklch/rgb/hsl/hex, and generate harmonious
							palettes &mdash; all with URL-shareable state.
						</DialogDescription>
					</DialogHeader>
					<div className="font-mono text-[10px] text-muted-foreground space-y-1">
						<p>
							Built by{" "}
							<a
								href="https://harv.computer"
								target="_blank"
								rel="noopener noreferrer"
								className="text-foreground hover:underline"
							>
								harv
							</a>{" "}
							in Bicol, Philippines
						</p>
						<p>
							MIT License &mdash;{" "}
							<a
								href="https://github.com/haroldjeshua/bicolor"
								target="_blank"
								rel="noopener noreferrer"
								className="text-foreground hover:underline"
							>
								GitHub
							</a>
						</p>
						<p className="pt-2 text-muted-foreground/60">
							oklch &middot; culori &middot; Next.js &middot; Tailwind v4
						</p>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={wipOpen} onOpenChange={setWipOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Coming soon</DialogTitle>
						<DialogDescription>Features in the pipeline.</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						{(
							[
								["Login & Saved", "Auth, saved palettes, organize your library"],
								[
									"Combos",
									"Two dominant colors plus one accent, with a 60-30-10 preview",
								],
								[
									"Contrast",
									"WCAG accessibility checker for your color combos",
								],
								["Tokens", "Export design tokens for Tailwind, CSS, Figma"],
							] as const
						).map(([label, desc]) => (
							<div
								key={label}
								className="flex items-start gap-2 font-mono text-[10px]"
							>
								<span className="mt-1.25 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
								<div className="flex-1">
									<p className="text-foreground">{label}</p>
									<p className="text-muted-foreground">{desc}</p>
								</div>
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</header>
	);
}
