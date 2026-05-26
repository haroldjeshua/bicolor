export function formatColorLines(hex: string, values: Record<string, string | null>) {
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
) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const dpr = 2;
	const swatchSize = 320;
	const lineHeight = 18;
	const fontSize = 11;
	const padding = 24;
	const lines = formatColorLines(hex, values);
	const textHeight = lines.length * lineHeight + 8;

	const w = swatchSize + padding * 2;
	const h = swatchSize + textHeight + padding * 2;
	canvas.width = w * dpr;
	canvas.height = h * dpr;
	ctx.scale(dpr, dpr);

	ctx.fillStyle = "#18181b";
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = hex;
	ctx.fillRect(padding, padding, swatchSize, swatchSize);

	ctx.fillStyle = "#ffffff";
	ctx.font = `500 ${fontSize}px "Geist Mono", "SF Mono", "Cascadia Code", "Consolas", monospace`;
	ctx.textBaseline = "top";

	const textX = padding;
	let textY = padding + swatchSize + 12;

	for (const line of lines) {
		ctx.fillText(line, textX, textY);
		textY += lineHeight;
	}

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
	const labelW = 50;

	const otherModels = MODELS.filter((m) => m !== aModel && m !== bModel);
	const contentW = swatchSize;
	const w = contentW + padding * 2;
	const highlightBlock = 2 * (highlightSize + 4) + 8;
	const gridLines = otherModels.length * lineHeight;
	const h = padding + swatchSize + 12 + highlightBlock + gridLines + padding + 16;

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
		ctx.fillStyle = "#a78bfa";
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
	const lines = formatColorLines(hex, values);
	const textHeight = lines.length * lineHeight + 8;

	const w = swatchSize + padding * 2;
	const h = swatchSize + textHeight + padding * 2;
	canvas.width = w * dpr;
	canvas.height = h * dpr;
	ctx.scale(dpr, dpr);

	ctx.fillStyle = "#18181b";
	ctx.fillRect(0, 0, w, h);

	ctx.fillStyle = hex;
	ctx.fillRect(padding, padding, swatchSize, swatchSize);

	ctx.fillStyle = "#ffffff";
	ctx.font = `500 ${fontSize}px "Geist Mono", "SF Mono", "Cascadia Code", "Consolas", monospace`;
	ctx.textBaseline = "top";

	const textX = padding;
	let textY = padding + swatchSize + 12;

	for (const line of lines) {
		ctx.fillText(line, textX, textY);
		textY += lineHeight;
	}

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob((b) => resolve(b), "image/png"),
	);
	if (!blob) throw new Error("Could not generate image");

	const file = new File([blob], "bicolor-color-card.png", { type: "image/png" });
	await navigator.share({
		title: "bicolor color",
		files: [file],
	});
	return true;
}
