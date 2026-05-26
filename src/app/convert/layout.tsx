import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "bicolor — convert",
	description:
		"Convert colors between oklch, oklab, rgb, hsl, lch, and hex. Real-time conversion with URL-shareable state.",
	openGraph: {
		title: "bicolor — convert",
		description: "Real-time color conversion between all major color models.",
	},
};

export default function ConvertLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
