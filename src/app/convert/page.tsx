import type { Metadata, ResolvingMetadata } from "next";
import ConvertPageContent from "./ConvertClient";

type Props = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
	{ searchParams }: Props,
	_parent: ResolvingMetadata,
): Promise<Metadata> {
	const params = await searchParams;
	const value = params.value as string | undefined;
	const from = (params.from as string) ?? "hex";
	const ogColor = value ? encodeURIComponent(value) : undefined;
	const ogUrl = ogColor ? `/api/og?color=${ogColor}` : "/api/og";

	const title = value
		? `${value} — bicolor convert`
		: "bicolor — convert";

	return {
		title,
		description: `Convert ${value || "colors"} between oklch, oklab, rgb, hsl, lch, and hex.`,
		openGraph: {
			title,
			description: "Real-time color conversion between all major color models.",
			images: [{ url: ogUrl, width: 1200, height: 630 }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: "Real-time color conversion between all major color models.",
			images: [ogUrl],
		},
	};
}

export default function ConvertPage() {
	return <ConvertPageContent />;
}
