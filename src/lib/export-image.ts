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
