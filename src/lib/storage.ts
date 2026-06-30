export interface SavedItem {
	id: string;
	type: "color" | "palette" | "gradient";
	label: string;
	url: string;
	value?: string;
	model?: string;
	createdAt: string;
}

const STORAGE_KEY = "bicolor_saved";

function read(): SavedItem[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		return JSON.parse(raw) as SavedItem[];
	} catch {
		return [];
	}
}

function write(items: SavedItem[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	} catch {}
}

export function saveItem(item: Omit<SavedItem, "id" | "createdAt">): SavedItem {
	const full: SavedItem = {
		...item,
		id: crypto.randomUUID(),
		createdAt: new Date().toISOString(),
	};
	const items = read();
	write([full, ...items]);
	return full;
}

export function getItems(type?: SavedItem["type"]): SavedItem[] {
	const items = read();
	if (type) return items.filter((i) => i.type === type);
	return items;
}

export function deleteItem(id: string): void {
	const items = read();
	write(items.filter((i) => i.id !== id));
}
