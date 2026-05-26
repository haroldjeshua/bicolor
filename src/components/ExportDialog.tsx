"use client";

import { useCallback, useMemo } from "react";
import { sileo } from "sileo";
import { CopySimpleIcon } from "@phosphor-icons/react";
import { convertAll } from "@/lib/color";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type FormatId = "plain" | "css" | "tailwind" | "figma";

interface Format {
	id: FormatId;
	label: string;
	disabled?: boolean;
}

const FORMATS: Format[] = [
	{ id: "plain", label: "Plain Text" },
	{ id: "css", label: "CSS" },
	{ id: "tailwind", label: "Tailwind" },
	{ id: "figma", label: "Figma Tokens", disabled: true },
];

function formatAsPlain(hex: string, values: Record<string, string | null>): string {
	return [
		`hex: ${values.hex ?? "\u2014"}`,
		`rgb: ${values.rgb ?? "\u2014"}`,
		`hsl: ${values.hsl ?? "\u2014"}`,
		`oklch: ${values.oklch ?? "\u2014"}`,
		`oklab: ${values.oklab ?? "\u2014"}`,
		`lch: ${values.lch ?? "\u2014"}`,
	].join("\n");
}

function formatAsCSS(hex: string, values: Record<string, string | null>): string {
	return [
		`--color: ${values.hex ?? "\u2014"};`,
		`--color-rgb: ${values.rgb ?? "\u2014"};`,
		`--color-hsl: ${values.hsl ?? "\u2014"};`,
		`--color-oklch: ${values.oklch ?? "\u2014"};`,
		`--color-oklab: ${values.oklab ?? "\u2014"};`,
		`--color-lch: ${values.lch ?? "\u2014"};`,
	].join("\n");
}

function formatAsTailwind(hex: string, values: Record<string, string | null>): string {
	return [
		`@theme {`,
		`  --color-brand: ${values.hex ?? "\u2014"};`,
		`  --color-brand-rgb: ${values.rgb ?? "\u2014"};`,
		`  --color-brand-hsl: ${values.hsl ?? "\u2014"};`,
		`  --color-brand-oklch: ${values.oklch ?? "\u2014"};`,
		`  --color-brand-oklab: ${values.oklab ?? "\u2014"};`,
		`  --color-brand-lch: ${values.lch ?? "\u2014"};`,
		`}`,
	].join("\n");
}

export default function ExportDialog({
	open,
	onOpenChangeAction,
	color,
}: {
	open: boolean;
	onOpenChangeAction: (open: boolean) => void;
	color: string;
}) {
	const values = useMemo(() => convertAll(color, "hex"), [color]);

	const getFormatted = useCallback(
		(format: FormatId) => {
			switch (format) {
				case "plain": return formatAsPlain(color, values);
				case "css": return formatAsCSS(color, values);
				case "tailwind": return formatAsTailwind(color, values);
				case "figma": return "// Coming soon";
			}
		},
		[color, values],
	);

	const handleCopy = useCallback(
		async (format: FormatId) => {
			const text = getFormatted(format);
			const label = FORMATS.find((f) => f.id === format)?.label ?? format;
			try {
				await navigator.clipboard.writeText(text);
				sileo.success({ title: `Copied ${label}`, icon: <CopySimpleIcon size={16} /> });
			} catch {
				sileo.error({ title: `Failed to copy ${label}` });
			}
		},
		[getFormatted],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChangeAction}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Copy color</DialogTitle>
				</DialogHeader>

				<div className="flex items-center gap-3">
					<div
						className="size-10 shrink-0 border border-border"
						style={{ background: color }}
					/>
					<div className="font-mono text-[10px] text-muted-foreground truncate">
						{values.hex}
					</div>
				</div>

				<Tabs defaultValue="plain">
					<TabsList variant="line">
						{FORMATS.map((f) => (
							<TabsTrigger key={f.id} value={f.id} disabled={f.disabled}>
								{f.label}
							</TabsTrigger>
						))}
					</TabsList>
					{FORMATS.map((f) => (
						<TabsContent key={f.id} value={f.id}>
							<div className="relative">
								<pre className="bg-muted p-3 font-mono text-[10px] leading-relaxed overflow-x-auto whitespace-pre-wrap text-foreground">
									{getFormatted(f.id)}
								</pre>
								{!f.disabled && (
									<Button
										variant="outline"
										size="xs"
										onClick={() => handleCopy(f.id)}
										className="absolute top-2 right-2"
									>
										<CopySimpleIcon />
										Copy
									</Button>
								)}
								{f.disabled && (
									<div className="mt-2 text-[10px] text-muted-foreground text-center italic">
										Coming soon
									</div>
								)}
							</div>
						</TabsContent>
					))}
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
