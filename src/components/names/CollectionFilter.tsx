"use client";

import {
	COLLECTION_FILTER_VALUES,
	type CollectionFilterValue,
} from "@/lib/colors";
import SegmentedControl from "./SegmentedControl";

const FILTER_LABELS: Record<CollectionFilterValue, string> = {
	all: "All",
	css: "CSS",
	tailwind: "Tailwind",
	xkcd: "XKCD",
};

interface CollectionFilterProps {
	value: CollectionFilterValue;
	counts: Readonly<Record<CollectionFilterValue, number>>;
	onValueChange: (value: CollectionFilterValue) => void;
}

export default function CollectionFilter({
	value,
	counts,
	onValueChange,
}: CollectionFilterProps) {
	return (
		<SegmentedControl
			label="Filter by color collection"
			value={value}
			onValueChange={onValueChange}
			options={COLLECTION_FILTER_VALUES.map((filter) => ({
				value: filter,
				label: FILTER_LABELS[filter],
				count: counts[filter],
			}))}
		/>
	);
}
