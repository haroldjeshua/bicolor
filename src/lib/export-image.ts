import type { PaletteStep } from "@/lib/color";
import type { ColorModel } from "@/lib/constants";

export function formatColorLines(
	hex: string,
	values: Record<string, string | null>,
) {
	return [
		`hex: ${values.hex ?? "\u2014"}`,
		`rgb: ${values.rgb ?? "\u2014"}`,
		`hsl: ${values.hsl ?? "\u2014"}`,
		`oklch: ${values.oklch ?? "\u2014"}`,
		`oklab: ${values.oklab ?? "\u2014"}`,
		`lch: ${values.lch ?? "\u2014"}`,
	];
}

export interface ContrastCardInput {
	fg: string;
	bg: string;
	/** 1–21; pass null to render the ratio as unknown (e.g. invalid input). */
	ratio: number | null;
	aa: { normal: boolean; large: boolean };
	aaa: { normal: boolean; large: boolean };
	nonTextUI: boolean;
	suggestionAA?: { color: string; ratio: number } | null;
	suggestionAAA?: { color: string; ratio: number } | null;
	mode?: "solid" | "gradient";
	gradientStops?: { color: string; position: number }[];
	gradientAngle?: number;
	filename?: string;
}

export async function downloadContrastCard({
	fg,
	bg,
	ratio,
	aa,
	aaa,
	nonTextUI,
	suggestionAA,
	suggestionAAA,
	mode = "solid",
	gradientStops,
	gradientAngle = 90,
	filename,
}: ContrastCardInput) {
	// Measurement constants — every vertical line of ink lands in its own row.
	const dpr = 2;
	const P = 32;              // outer padding
	const GAP = 12;            // gap between blocks
	const W = 600;
	const mono = '"Geist Mono","SF Mono","Cascadia Code","Consolas",monospace';
	const sans = '"Geist","Inter","Helvetica Neue",Arial,sans-serif';
	const ratioText = ratio === null ? "-- : 1" : `${ratio.toFixed(2)} : 1`;
	const name =
		filename ??
		(mode === "gradient"
			? `bicolor-contrast-gradient-${fg.replace("#", "")}`
			: `bicolor-contrast-solid-${fg.replace("#", "")}-on-${bg.replace("#", "")}`);

	const ratioH = 64;
	const rowsH = 5 * 24 + 12;
	const suggestionsCount = (suggestionAA ? 1 : 0) + (suggestionAAA ? 1 : 0);
	const suggestionsH = suggestionsCount > 0 ? suggestionsCount * 24 + 30 : 0;

	const h =
		P +        // top padding
		20 +       // header row
		GAP +
		176 +      // preview block
		GAP +
		ratioH +
		GAP +
		rowsH +
		(suggestionsCount > 0 ? GAP + suggestionsH : 0) +
		P;         // bottom padding

	const canvas = document.createElement("canvas");
	canvas.width = W * dpr;
	canvas.height = h * dpr;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	ctx.scale(dpr, dpr);


	// ── Chrome background ─────────────────────────────────────────────
	ctx.fillStyle = "#18181b";
	ctx.fillRect(0, 0, W, h);

	const fill = (color: string, x: number, y: number, w: number, h: number) => {
		ctx.fillStyle = color;
		ctx.fillRect(x, y, w, h);
	};

	// ── Header: wordmark ───────────────────────────────────────────────
	ctx.textBaseline = "top";
	ctx.textAlign = "left";
	ctx.fillStyle = "#f4f4f5";
	ctx.font = `700 15px ${sans}`;
	ctx.fillText("bicolor — contrast", P, P);

	let y = P + 20 + GAP;

	// ── Preview block (fg on bg, full-bleed horizontal) ───────────────
	const previewY = y;
	if (mode === "gradient" && gradientStops && gradientStops.length >= 2) {
		const rad = (gradientAngle * Math.PI) / 180;
		const dx = Math.sin(rad), dy = -Math.cos(rad);
		const halfW = W / 2, halfH = 176 / 2;
		const len = Math.abs(halfW * dx) + Math.abs(halfH * dy);
		const cx2 = W / 2, cy = previewY + 176 / 2;
		const grad = ctx.createLinearGradient(cx2 - dx * len, cy - dy * len, cx2 + dx * len, cy + dy * len);
		const stops = [...gradientStops].sort((a, b) => a.position - b.position);
		for (const s of stops) grad.addColorStop(s.position / 100, s.color);
		ctx.fillStyle = grad;
		ctx.fillRect(0, previewY, W, 176);
	} else {
		fill(bg, 0, previewY, W, 176);
	}

	ctx.textAlign = "left";
	ctx.fillStyle = fg;
	ctx.font = `600 92px ${sans}`;
	ctx.textBaseline = "middle";
	ctx.fillText("Aa", P, previewY + 56);

	ctx.globalAlpha = 0.78;
	ctx.font = `400 13px ${sans}`;
	ctx.fillText(
		"The quick brown fox jumps over the lazy dog",
		P,
		previewY + 130,
	);
	ctx.globalAlpha = 1;

	y += 176 + GAP;

	// ── Ratio block ───────────────────────────────────────────────────
	ctx.textBaseline = "alphabetic";
	ctx.fillStyle = "#71717a";
	ctx.font = `600 10px ${mono}`;
	ctx.textAlign = "left";
	ctx.fillText("WCAG CONTRAST RATIO", P, y + 12);

	// Right side: fg / bg pair, stacked and aligned with ratio label
	ctx.font = `600 10px ${mono}`;

	ctx.textAlign = "left";
	ctx.fillStyle = "#71717a";
	ctx.fillText("FG", W - P - 116, y + 36);
	ctx.fillText("BG", W - P - 116, y + 54);

	ctx.textAlign = "right";
	ctx.fillStyle = "#f4f4f5";
	ctx.fillText(fg, W - P, y + 36);
	ctx.fillStyle = "#a1a1aa";
	ctx.fillText(mode === "gradient" ? "gradient" : bg, W - P, y + 54);

	// Numeral baseline — leave room for the right column
	ctx.textAlign = "left";
	ctx.fillStyle = "#f4f4f5";
	ctx.font = `600 44px ${mono}`;
	ctx.fillText(ratioText, P, y + 52);

	y += ratioH + GAP;

	// ── Divider ───────────────────────────────────────────────────────
	fill("#27272a", P, y, W - P * 2, 1);
	y += 12;

	// ── WCAG result rows ──────────────────────────────────────────────
	const row = (label: string, detail: string, pass: boolean) => {
		// dot
		ctx.beginPath();
		ctx.arc(P + 4, y + 7, 4, 0, Math.PI * 2);
		ctx.fillStyle = pass ? "#22c55e" : "#ef4444";
		ctx.fill();

		// label col, fixed width
		ctx.textAlign = "left";
		ctx.fillStyle = "#f4f4f5";
		ctx.font = `500 11px ${mono}`;
		ctx.fillText(label, P + 18, y + 12);

		ctx.fillStyle = "#71717a";
		ctx.fillText(detail, P + 86, y + 12);

		ctx.fillStyle = pass ? "#22c55e" : "#ef4444";
		ctx.textAlign = "right";
		ctx.fillText(pass ? "PASS" : "FAIL", W - P, y + 12);

		y += 24;
	};

	row("AA", "Normal text 4.5:1", aa.normal);
	row("AA", "Large text 3:1", aa.large);
	row("AAA", "Normal text 7:1", aaa.normal);
	row("AAA", "Large text 4.5:1", aaa.large);
	row("UI", "Non-text 3:1", nonTextUI);

	// ── Suggestions ───────────────────────────────────────────────────
	if (suggestionsCount > 0) {
		y += 6;
		fill("#27272a", P, y, W - P * 2, 1);
		y += 12;

		ctx.textAlign = "left";
		ctx.fillStyle = "#71717a";
		ctx.font = `600 10px ${mono}`;
		ctx.fillText("SUGGESTED FOREGROUND (HUE PRESERVED)", P, y + 10);
		y += 18;

		const sugRow = (label: string, s: { color: string; ratio: number }) => {
			// swatch — actual suggested color, filled in
			fill(s.color, P, y, 16, 16);

			ctx.fillStyle = "#f4f4f5";
			ctx.font = `500 11px ${mono}`;
			ctx.textBaseline = "middle";
			ctx.fillText(`${label} — ${s.color} · ${s.ratio.toFixed(2)}:1`, P + 24, y + 8);
			y += 24;
		};

		if (suggestionAA) sugRow("AA", suggestionAA);
		if (suggestionAAA) sugRow("AAA", suggestionAAA);
		ctx.textBaseline = "alphabetic";
	}

	// ── Footer ────────────────────────────────────────────────────────
	fill("#27272a", P, y + 4, W - P * 2, 1);
	ctx.fillStyle = "#52525b";
	ctx.font = `400 10px ${mono}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText(
		`bicolor.harv.computer/contrast · ${mode === "gradient" ? "gradient" : "solid"}`,
		P,
		y + 10,
	);

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), "image/png"),
	);
	if (!blob) throw new Error("Could not generate image");

	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${name}.png`;
	a.click();
	URL.revokeObjectURL(url);
}


export async function downloadColorCard(
	hex: string,
	values: Record<string, string | null>,
	filename = `bicolor-${hex.replace("#", "")}`,
	path = "/picker",
) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const dpr = 2;
	const swatchSize = 320;
	const lineHeight = 18;
	const fontSize = 11;
	const padding = 24;
	const footerExtra = 28;
	const lines = formatColorLines(hex, values);
	const textHeight = lines.length * lineHeight + 8;

	const w = swatchSize + padding * 2;
	const h = swatchSize + textHeight + padding * 2 + footerExtra;
	canvas.width = w * dpr;
	canvas.height = h * dpr;
	ctx.scale(dpr, dpr);

	const mono = '"Geist Mono","SF Mono","Cascadia Code","Consolas",monospace';

	ctx.fillStyle = "#18181b";
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = hex;
	ctx.fillRect(padding, padding, swatchSize, swatchSize);

	ctx.fillStyle = "#ffffff";
	ctx.font = `500 ${fontSize}px ${mono}`;
	ctx.textBaseline = "top";

	const textX = padding;
	let textY = padding + swatchSize + 12;

	for (const line of lines) {
		ctx.fillText(line, textX, textY);
		textY += lineHeight;
	}

	ctx.fillStyle = "#52525b";
	ctx.font = `400 9px ${mono}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "bottom";
	ctx.fillText(`bicolor.harv.computer${path}`, padding, h - 8);

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), "image/png"),
	);
	if (!blob) throw new Error("Could not generate image");

	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${filename}.png`;
	a.click();
	URL.revokeObjectURL(url);
}

const MODELS = ["hex", "rgb", "hsl", "oklch", "oklab", "lch"] as const;

export async function downloadConvertCard(
	color: string,
	aModel: string,
	aValue: string,
	bModel: string,
	bValue: string,
	values: Record<string, string | null>,
	filename = "bicolor-convert",
	path = "/convert",
) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const dpr = 2;
	const swatchSize = 240;
	const lineHeight = 18;
	const highlightSize = 14;
	const fontSize = 11;
	const padding = 24;
	const footerExtra = 28;
	const labelW = 50;

	const otherModels = MODELS.filter((m) => m !== aModel && m !== bModel);
	const contentW = swatchSize;
	const w = contentW + padding * 2;
	const highlightBlock = 2 * (highlightSize + 4) + 8;
	const gridLines = otherModels.length * lineHeight;
	const h =
		padding +
		swatchSize +
		12 +
		highlightBlock +
		gridLines +
		padding +
		16 +
		footerExtra;

	canvas.width = w * dpr;
	canvas.height = h * dpr;
	ctx.scale(dpr, dpr);

	const mono = '"Geist Mono","SF Mono","Cascadia Code","Consolas",monospace';

	ctx.fillStyle = "#18181b";
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = color;
	ctx.fillRect(padding, padding, swatchSize, swatchSize);

	const textX = padding;
	let textY = padding + swatchSize + 12;

	ctx.textBaseline = "top";

	const drawHighlight = (label: string, value: string) => {
		ctx.fillStyle = "#ffffff";
		ctx.font = `700 ${highlightSize}px ${mono}`;
		ctx.fillText(label, textX, textY);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(value, textX + labelW, textY);
		textY += highlightSize + 4;
	};

	drawHighlight(aModel.toUpperCase(), aValue);
	drawHighlight(bModel.toUpperCase(), bValue);

	textY += 4;

	ctx.fillStyle = "#27272a";
	ctx.fillRect(textX, textY, w - padding * 2, 1);
	textY += 12;

	ctx.font = `400 ${fontSize}px ${mono}`;
	for (const model of otherModels) {
		ctx.fillStyle = "#71717a";
		ctx.fillText(model, textX, textY);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(values[model] ?? "\u2014", textX + labelW, textY);
		textY += lineHeight;
	}

	ctx.fillStyle = "#52525b";
	ctx.font = `400 9px ${mono}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "bottom";
	ctx.fillText(`bicolor.harv.computer${path}`, padding, h - 8);

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), "image/png"),
	);
	if (!blob) throw new Error("Could not generate image");

	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${filename}.png`;
	a.click();
	URL.revokeObjectURL(url);
}

export async function shareColorCard(
	hex: string,
	values: Record<string, string | null>,
	path = "/picker",
) {
	if (!navigator.share) return false;

	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return false;

	const dpr = 2;
	const swatchSize = 320;
	const lineHeight = 18;
	const fontSize = 11;
	const padding = 24;
	const footerExtra = 28;
	const lines = formatColorLines(hex, values);
	const textHeight = lines.length * lineHeight + 8;

	const w = swatchSize + padding * 2;
	const h = swatchSize + textHeight + padding * 2 + footerExtra;
	canvas.width = w * dpr;
	canvas.height = h * dpr;
	ctx.scale(dpr, dpr);

	const mono = '"Geist Mono","SF Mono","Cascadia Code","Consolas",monospace';

	ctx.fillStyle = "#18181b";
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = hex;
	ctx.fillRect(padding, padding, swatchSize, swatchSize);

	ctx.fillStyle = "#ffffff";
	ctx.font = `500 ${fontSize}px ${mono}`;
	ctx.textBaseline = "top";

	const textX = padding;
	let textY = padding + swatchSize + 12;

	for (const line of lines) {
		ctx.fillText(line, textX, textY);
		textY += lineHeight;
	}

	ctx.fillStyle = "#52525b";
	ctx.font = `400 9px ${mono}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "bottom";
	ctx.fillText(`bicolor.harv.computer${path}`, padding, h - 8);

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), "image/png"),
	);
	if (!blob) throw new Error("Could not generate image");

	const file = new File([blob], "bicolor-color-card.png", {
		type: "image/png",
	});
	await navigator.share({
		title: "bicolor color",
		files: [file],
	});
	return true;
}

export async function downloadPaletteCard(
	steps: PaletteStep[],
	seedStep: number,
	displayModel: ColorModel,
	filename = "bicolor-palette",
	path = "/palette",
	orientation: "horizontal" | "vertical" = "horizontal",
) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const dpr = 2;
	const padding = 32;
	const footerExtra = 28;
	const mono = '"Geist Mono","SF Mono","Cascadia Code","Consolas",monospace';
	const tailwindSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
	const count = steps.length;

	const seed = steps.find((s) => s.index === seedStep);
	const seedValue = seed
		? ((seed[displayModel as keyof PaletteStep] as string) ?? "")
		: "";

	if (orientation === "vertical") {
		const swatchSize = 28;
		const rowGap = 6;
		const rowH = swatchSize + rowGap;
		const labelW = 36;

		const longestVal = steps.reduce((max, s) => {
			const v = (s[displayModel as keyof PaletteStep] as string) ?? "";
			return v.length > max.length ? v : max;
		}, "");
		ctx.font = `400 10px ${mono}`;
		const valW = ctx.measureText(longestVal).width;
		const contentW = swatchSize + 8 + labelW + 8 + valW;
		const w = contentW + padding * 2;

		const h =
			padding + 14 + 8 + count * rowH + 12 + 11 + 14 + padding + footerExtra;

		canvas.width = w * dpr;
		canvas.height = h * dpr;
		ctx.scale(dpr, dpr);

		ctx.fillStyle = "#18181b";
		ctx.fillRect(0, 0, w, h);

		ctx.fillStyle = "#ffffff";
		ctx.font = `700 14px ${mono}`;
		ctx.textBaseline = "top";
		ctx.fillText("bicolor · palette", padding, padding);

		let y = padding + 14 + 8;

		for (let i = 0; i < count; i++) {
			const x = padding;
			ctx.fillStyle = steps[i].hex;
			ctx.fillRect(x, y, swatchSize, swatchSize);

			ctx.textAlign = "left";
			ctx.textBaseline = "middle";

			ctx.fillStyle = "#ffffff";
			ctx.font = `600 10px ${mono}`;
			ctx.fillText(String(tailwindSteps[i]), x + swatchSize + 8, y + swatchSize / 2);

			const val = (steps[i][displayModel as keyof PaletteStep] as string) ?? "";
			ctx.fillStyle = "#ffffff";
			ctx.font = `400 10px ${mono}`;
			ctx.fillText(val, x + swatchSize + 8 + labelW, y + swatchSize / 2);

			y += rowH;
		}

		y += 4;
		ctx.textAlign = "center";
		ctx.fillStyle = "#ffffff";
		ctx.font = `600 11px ${mono}`;
		ctx.fillText(seedValue, w / 2, y);

		y += 11 + 10;

		ctx.fillStyle = "#52525b";
		ctx.font = `400 9px ${mono}`;
		ctx.textAlign = "left";
		ctx.textBaseline = "bottom";
		ctx.fillText(`bicolor.harv.computer${path}`, padding, h - 8);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob((b) => resolve(b), "image/png"),
		);
		if (!blob) throw new Error("Could not generate image");

		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${filename}.png`;
		a.click();
		URL.revokeObjectURL(url);
		return;
	}

	const swatchSize = 56;
	const swatchGap = 4;
	const stepLineHeight = 18;

	const swatchW = count * (swatchSize + swatchGap) - swatchGap;
	const w = swatchW + padding * 2;

	const h =
		padding +
		14 +
		8 +
		swatchSize +
		10 +
		10 +
		14 +
		11 +
		14 +
		1 +
		10 +
		count * stepLineHeight +
		padding +
		footerExtra;

	canvas.width = w * dpr;
	canvas.height = h * dpr;
	ctx.scale(dpr, dpr);

	ctx.fillStyle = "#18181b";
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = "#ffffff";
	ctx.font = `700 14px ${mono}`;
	ctx.textBaseline = "top";
	ctx.fillText("bicolor · palette", padding, padding);

	let y = padding + 14 + 8;

	for (let i = 0; i < count; i++) {
		const x = padding + i * (swatchSize + swatchGap);
		ctx.fillStyle = steps[i].hex;
		ctx.fillRect(x, y, swatchSize, swatchSize);

		if (steps[i].index === seedStep) {
			ctx.fillStyle = "#ffffff";
			const barH = 3;
			const barW = swatchSize * 0.5;
			ctx.fillRect(x + (swatchSize - barW) / 2, y + swatchSize - barH, barW, barH);
		}
	}

	y += swatchSize + 10;
	ctx.fillStyle = "#71717a";
	ctx.font = `400 10px ${mono}`;
	ctx.textAlign = "center";
	for (let i = 0; i < count; i++) {
		const cx = padding + i * (swatchSize + swatchGap) + swatchSize / 2;
		ctx.fillText(String(tailwindSteps[i]), cx, y);
	}

	y += 10 + 14;

	ctx.textAlign = "left";
	ctx.fillStyle = "#ffffff";
	ctx.font = `600 11px ${mono}`;
	ctx.fillText(seedValue, padding, y);

	y += 11 + 14;

	ctx.fillStyle = "#27272a";
	ctx.fillRect(padding, y, swatchW, 1);
	y += 10;

	ctx.font = `400 10px ${mono}`;
	for (let i = 0; i < count; i++) {
		const val = (steps[i][displayModel as keyof PaletteStep] as string) ?? "";
		ctx.fillStyle = "#71717a";
		ctx.fillText(String(tailwindSteps[i]), padding, y);
		ctx.fillStyle = "#ffffff";
		ctx.fillText(val, padding + 36, y);
		y += stepLineHeight;
	}

	ctx.fillStyle = "#52525b";
	ctx.font = `400 9px ${mono}`;
	ctx.textAlign = "left";
	ctx.textBaseline = "bottom";
	ctx.fillText(`bicolor.harv.computer${path}`, padding, h - 8);

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), "image/png"),
	);
	if (!blob) throw new Error("Could not generate image");

	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${filename}.png`;
	a.click();
	URL.revokeObjectURL(url);
}
