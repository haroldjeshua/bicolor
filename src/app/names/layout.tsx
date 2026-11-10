import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "bicolor — names",
	description:
		"Search CSS, Tailwind v4, and XKCD color names. Paste any color to find its closest established name, copy names and HEX values, or open any color in the picker.",
	openGraph: {
		title: "bicolor — names",
		description:
			"A searchable reference library of CSS named colors, the official Tailwind CSS v4 palette, and the XKCD color survey.",
	},
};

export default function NamesLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
