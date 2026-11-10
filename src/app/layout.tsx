import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ActionBarProvider, ActionBar } from "@/components/ActionBar";
import ThemeAwareToaster from "@/components/ThemeAwareToaster";
import Header from "@/components/Header";
import { DemoColorSync } from "@/components/DemoColorSync";
import AgentationWrapper from "@/components/AgentationWrapper";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";

const geistMonoHeading = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-heading",
});

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL("https://bicolor.app"),
	title: "bicolor — Pick. Convert. Palette.",
	description:
		"A deadsimple, zero-overhead color tool for designers and developers. Pick colors, convert between models, generate palettes.",
	openGraph: {
		title: "bicolor — Pick. Convert. Palette.",
		description:
			"A deadsimple, zero-overhead color tool for designers and developers.",
		siteName: "bicolor",
		images: [
			{
				url: "/api/og",
				width: 1200,
				height: 630,
				alt: "bicolor — Pick. Convert. Palette.",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "bicolor — Pick. Convert. Palette.",
		description:
			"A deadsimple, zero-overhead color tool for designers and developers.",
		images: ["/api/og"],
	},
};

export const viewport: Viewport = {
	themeColor: "#09090b",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			className={cn(
				"h-full",
				"antialiased",
				geistSans.variable,
				geistMono.variable,
				geistMonoHeading.variable,
			)}
			suppressHydrationWarning
		>
			<body className="bg-background text-foreground font-sans">
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					<ActionBarProvider>
						<Header />
						<main className="pt-12">{children}</main>
						<ActionBar />
					</ActionBarProvider>
					<DemoColorSync />
					<AgentationWrapper />
					<ThemeAwareToaster />
				</ThemeProvider>
				<Analytics />
			</body>
		</html>
	);
}
