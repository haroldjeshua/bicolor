import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "bicolor — palette",
	description:
		"Generate 11-step color palettes from any seed color. Export as CSS custom properties, Tailwind theme, or JSON.",
	openGraph: {
		title: "bicolor — palette",
		description: "Generate harmonious color palettes with oklch interpolation.",
	},
};

export default function PaletteLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
