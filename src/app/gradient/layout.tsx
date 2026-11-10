import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "bicolor — gradient",
	description:
		"Build a CSS gradient visually. Drag stops, scrub the angle, insert stops by clicking the strip, and copy the CSS or Tailwind class.",
	openGraph: {
		title: "bicolor — gradient",
		description:
			"Build CSS linear, radial, and conic gradients visually with URL-shareable state.",
	},
};

export default function GradientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
