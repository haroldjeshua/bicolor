"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
	{ href: "/picker", label: "picker" },
	{ href: "/convert", label: "convert" },
	{ href: "/palette", label: "palette" },
] as const;

function SunIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="5" />
			<line x1="12" y1="1" x2="12" y2="3" />
			<line x1="12" y1="21" x2="12" y2="23" />
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
			<line x1="1" y1="12" x2="3" y2="12" />
			<line x1="21" y1="12" x2="23" y2="12" />
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
		</svg>
	);
}

function MoonIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	);
}

function BurgerIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="3" y1="6" x2="21" y2="6" />
			<line x1="3" y1="12" x2="21" y2="12" />
			<line x1="3" y1="18" x2="21" y2="18" />
		</svg>
	);
}

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
					bicolor
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
							<SunIcon />
						</span>
						<span className="dark:hidden">
							<MoonIcon />
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
						<BurgerIcon />
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
