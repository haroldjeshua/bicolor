import {
	CSS_COLLECTION,
	TAILWIND_COLLECTION,
	TAILWIND_SHADES,
	XKCD_COLLECTION,
	groupTailwindColors,
	sortNamedColors,
	type ColorCollection,
	type NamedColor,
	type NameSortValue,
} from "@/lib/colors";
import ColorNameSwatch from "./ColorNameSwatch";

interface ColorNameGridProps {
	colors: readonly NamedColor[];
	sort: NameSortValue;
	onSelect?: (color: NamedColor) => void;
}

function CollectionMeta({
	collection,
	count,
}: {
	collection: ColorCollection;
	count: number;
}) {
	return (
		<p className="font-mono text-[10px] text-muted-foreground/60">
			{count} {count === 1 ? "color" : "colors"}
			<span aria-hidden> · </span>
			<a
				href={collection.sourceUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
			>
				{collection.source}
			</a>
			<span aria-hidden> · </span>
			{collection.license}
		</p>
	);
}

function FlatCollection({
	collection,
	colors,
	onSelect,
}: {
	collection: ColorCollection;
	colors: readonly NamedColor[];
	onSelect?: (color: NamedColor) => void;
}) {
	const headingId = `${collection.id}-heading`;

	return (
		<section aria-labelledby={headingId}>
			<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
				<h2
					id={headingId}
					className="font-mono text-xs uppercase tracking-wider text-foreground"
				>
					{collection.name}
				</h2>
				<CollectionMeta collection={collection} count={colors.length} />
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
				{colors.map((color) => (
					<ColorNameSwatch
						key={color.id}
						color={color}
						onSelect={onSelect}
					/>
				))}
			</div>
		</section>
	);
}

export default function ColorNameGrid({
	colors,
	sort,
	onSelect,
}: ColorNameGridProps) {
	const cssColors = sortNamedColors(
		colors.filter((color) => color.collection === "css"),
		sort,
	);
	const xkcdColors = sortNamedColors(
		colors.filter((color) => color.collection === "xkcd"),
		sort,
	);
	const tailwindGroups = groupTailwindColors(colors);

	return (
		<div className="flex flex-col gap-14">
			{cssColors.length > 0 && (
				<FlatCollection
					collection={CSS_COLLECTION}
					colors={cssColors}
					onSelect={onSelect}
				/>
			)}

			{tailwindGroups.length > 0 && (
				<section aria-labelledby="tailwind-heading">
					<div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
						<h2
							id="tailwind-heading"
							className="font-mono text-xs uppercase tracking-wider text-foreground"
						>
							{TAILWIND_COLLECTION.name}
						</h2>
						<CollectionMeta
							collection={TAILWIND_COLLECTION}
							count={tailwindGroups.reduce(
								(total, group) => total + group.colors.length,
								0,
							)}
						/>
					</div>

					<div className="flex flex-col gap-6">
						{tailwindGroups.map((group) => {
							const headingId = `tailwind-family-${group.family}`;

							return (
								<section key={group.family} aria-labelledby={headingId}>
									<div className="mb-2 flex items-baseline justify-between gap-2">
										<h3
											id={headingId}
											className="font-mono text-xs tracking-wide text-foreground"
										>
											{group.family}
										</h3>
										{group.colors.length < TAILWIND_SHADES.length && (
											<span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
												{group.colors.length}/{TAILWIND_SHADES.length}
											</span>
										)}
									</div>

									<div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
										{group.colors.map((color) => (
											<ColorNameSwatch
												key={color.id}
												color={color}
												label={String(color.shade)}
												compact
												onSelect={onSelect}
											/>
										))}
									</div>
								</section>
							);
						})}
					</div>
				</section>
			)}

			{xkcdColors.length > 0 && (
				<FlatCollection
					collection={XKCD_COLLECTION}
					colors={xkcdColors}
					onSelect={onSelect}
				/>
			)}
		</div>
	);
}
