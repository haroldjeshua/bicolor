"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { EqualsIcon, MoonStarsIcon, SunDimIcon } from "@phosphor-icons/react";

const NAV_ITEMS = [
	{ href: "/picker", label: "picker" },
	{ href: "/convert", label: "convert" },
	{ href: "/palette", label: "palette" },
] as const;

export default function Header() {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	const toggleDark = () => {
		const isDark = document.documentElement.classList.toggle("dark");
		localStorage.setItem("theme", isDark ? "dark" : "light");
	};

	// close mobile menu on outside click
	useEffect(() => {
		if (!menuOpen) return;
		const close = () => setMenuOpen(false);
		document.addEventListener("click", close);
		return () => document.removeEventListener("click", close);
	}, [menuOpen]);

	const isActive = (href: string) => pathname.startsWith(href);

	return (
		<header className="fixed top-0 left-0 right-0 h-12 border-b bg-background flex items-center px-4 md:px-6 z-50">
			<div className="grid grid-cols-2 md:grid-cols-3 w-full items-center">
				<Link
					href="/"
					className="justify-self-start font-mono text-sm tracking-tight text-foreground hover:text-muted-foreground transition-colors"
				>
					<Logo className="h-4 inline-block" />
					<span>bicolor</span>
				</Link>

				<nav className="hidden md:flex items-center justify-center gap-8">
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
							<span className={isActive(item.href) ? "" : "invisible"}>/</span>
							{item.label}
						</Link>
					))}
				</nav>

				<div className="flex items-center justify-self-end gap-3">
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
		</header>
	);
}
