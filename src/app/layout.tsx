import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ActionBarProvider, ActionBar } from "@/components/ActionBar";
import Header from "@/components/Header";
import AgentationWrapper from "@/components/AgentationWrapper";
import "./globals.css";
import { cn } from "@/lib/utils";

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
	title: "bicolor — Pick. Convert. Palette.",
	description:
		"A direct, zero-overhead color tool for designers and developers. Pick colors, convert between models, generate palettes.",
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
				<script
					dangerouslySetInnerHTML={{
						__html: `document.documentElement.classList.toggle("dark",localStorage.getItem("theme")!=="light")`,
					}}
				/>
				<ActionBarProvider>
					<Header />
					<main className="pt-12 pb-10 flex-1">{children}</main>
					<ActionBar />
				</ActionBarProvider>
				<AgentationWrapper />
			</body>
		</html>
	);
}
