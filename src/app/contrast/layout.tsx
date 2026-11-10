import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "bicolor — contrast checker",
	description:
		"WCAG 2.2 contrast evaluation for your text on a background. Normal and large text, AA/AAA pass/fail, plus a suggested foreground that reaches the threshold.",
	openGraph: {
		title: "bicolor — contrast checker",
		description:
			"Check WCAG contrast ratios for your foreground on a background, with passing-color suggestions.",
	},
};

export default function ContrastLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
