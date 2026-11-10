"use client";

import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CollectionFilter from "@/components/names/CollectionFilter";
import ColorNameGrid from "@/components/names/ColorNameGrid";
import NamesSearch from "@/components/names/NamesSearch";
import NearestColorFinder from "@/components/names/NearestColorFinder";
import SortToggle from "@/components/names/SortToggle";
import {
	ALL_NAMED_COLORS,
	countColorsByCollection,
	filterColorsByCollection,
	isCollectionFilterValue,
	isNameSortValue,
	searchNamedColors,
	type CollectionFilterValue,
	type NameSortValue,
	type NearestColorMatch,
} from "@/lib/colors";

function NamesPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
	const [collection, setCollection] = useState<CollectionFilterValue>(() => {
		const value = searchParams.get("collection");

		return isCollectionFilterValue(value) ? value : "all";
	});
	const [sort, setSort] = useState<NameSortValue>(() => {
		const value = searchParams.get("sort");

		return isNameSortValue(value) ? value : "name";
	});
	const [nearestColor, setNearestColor] = useState(
		() => searchParams.get("color") ?? "",
	);

	const searchResults = useMemo(
		() => searchNamedColors(ALL_NAMED_COLORS, query),
		[query],
	);

	const counts = useMemo(
		() => countColorsByCollection(searchResults),
		[searchResults],
	);

	const visibleColors = useMemo(
		() => filterColorsByCollection(searchResults, collection),
		[searchResults, collection],
	);

	const clearFilters = useCallback(() => {
		setQuery("");
		setCollection("all");
	}, []);

	const sortApplies = useMemo(
		() => visibleColors.some((color) => color.collection !== "tailwind"),
		[visibleColors],
	);

	const showNearestMatch = useCallback((match: NearestColorMatch) => {
		setCollection(match.collection);
		setQuery(match.color.name);
	}, []);

	useEffect(() => {
		const params = new URLSearchParams();
		const trimmedQuery = query.trim();
		const trimmedColor = nearestColor.trim();

		if (trimmedQuery) params.set("q", trimmedQuery);
		if (collection !== "all") params.set("collection", collection);
		if (sort !== "name") params.set("sort", sort);
		if (trimmedColor) params.set("color", trimmedColor);

		const next = params.toString();

		router.replace(next ? `${pathname}?${next}` : pathname, {
			scroll: false,
		});
	}, [query, collection, sort, nearestColor, router, pathname]);

	return (
		<section className="mx-auto w-full max-w-7xl px-4 pb-32 pt-20">
			<header className="flex flex-col gap-2 pb-8">
				<h1 className="font-mono text-2xl tracking-tight">color names</h1>
				<p className="max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground/60">
					A searchable reference of CSS named colors, the official Tailwind
					CSS v4 palette, and the XKCD color survey. Search by name or HEX,
					find the closest name for any color, copy a value, or open it in
					the picker.
				</p>
			</header>

			<div className="sticky top-12 z-30 -mx-4 border-b border-border/60 bg-background px-4 py-3">
				<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<NamesSearch value={query} onValueChange={setQuery} />
					<div className="flex flex-wrap items-center gap-2">
						<CollectionFilter
							value={collection}
							counts={counts}
							onValueChange={setCollection}
						/>
						<SortToggle
							value={sort}
							onValueChange={setSort}
							disabled={!sortApplies}
						/>
					</div>
				</div>
				<p className="sr-only" role="status" aria-live="polite">
					{visibleColors.length}{" "}
					{visibleColors.length === 1 ? "color" : "colors"} shown
				</p>
			</div>

			<NearestColorFinder
				value={nearestColor}
				onValueChange={setNearestColor}
				onSelect={showNearestMatch}
			/>

			<div className="pt-8">
				{visibleColors.length > 0 ? (
					<ColorNameGrid colors={visibleColors} sort={sort} />
				) : (
					<div className="flex flex-col items-center gap-3 py-24 text-center font-mono text-xs text-muted-foreground">
						<p>
						No colors match &ldquo;{query.trim()}&rdquo;.
					</p>
						<button
							type="button"
							onClick={clearFilters}
							className="cursor-pointer text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-muted-foreground"
						>
							Clear search and filters
						</button>
					</div>
				)}
			</div>
		</section>
	);
}

export default function NamesPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-full items-center justify-center font-mono text-sm text-muted-foreground">
					Loading...
				</div>
			}
		>
			<NamesPageContent />
		</Suspense>
	);
}
