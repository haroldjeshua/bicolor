import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "bicolor — Pick",
	description:
		"Pick and tweak colors with a full hex-alpha color picker. View oklch, rgb, hsl, and more. Screen color picker (Eyedropper) included.",
	openGraph: {
		title: "bicolor — Pick",
		description:
			"A full hex-alpha color picker with real-time color model conversion.",
	},
};

export default function PickerLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
