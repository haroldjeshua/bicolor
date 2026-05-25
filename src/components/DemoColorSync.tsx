"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function blendWithWhite(hex: string, amount: number) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	const nr = Math.round(r + (255 - r) * amount);
	const ng = Math.round(g + (255 - g) * amount);
	const nb = Math.round(b + (255 - b) * amount);
	return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

function setLogoVars(hex: string) {
	const root = document.documentElement;
	root.style.setProperty("--logo-fill-1", hex);
	root.style.setProperty("--logo-fill-2", blendWithWhite(hex, 0.3));
	root.style.setProperty("--logo-fill-3", blendWithWhite(hex, 0.55));
}

function ColorReader() {
	const searchParams = useSearchParams();

	useEffect(() => {
		const fromParam = searchParams.get("color") || searchParams.get("seed");
		const valueParam = searchParams.get("value");
		const hex = fromParam || valueParam;
		if (hex && /^#[0-9a-f]{6}/i.test(hex)) {
			setLogoVars(hex);
			try {
				sessionStorage.setItem("demoColor", hex);
			} catch {}
			return;
		}
		try {
			const saved = sessionStorage.getItem("demoColor");
			if (saved && /^#[0-9a-f]{6}/i.test(saved)) {
				setLogoVars(saved);
			}
		} catch {}
	}, [searchParams]);

	return null;
}

export function DemoColorSync() {
	return (
		<Suspense fallback={null}>
			<ColorReader />
		</Suspense>
	);
}
