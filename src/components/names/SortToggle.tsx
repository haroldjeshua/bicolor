"use client";

import { NAME_SORT_VALUES, type NameSortValue } from "@/lib/colors";
import SegmentedControl from "./SegmentedControl";

const SORT_LABELS: Record<NameSortValue, string> = {
	name: "Name",
	hue: "Hue",
};

interface SortToggleProps {
	value: NameSortValue;
	onValueChange: (value: NameSortValue) => void;
	disabled?: boolean;
}

export default function SortToggle({
	value,
	onValueChange,
	disabled,
}: SortToggleProps) {
	return (
		<SegmentedControl
			label="Sort colors"
			value={value}
			onValueChange={onValueChange}
			disabled={disabled}
			disabledHint="Tailwind rows are ordered by shade (50–950)"
			options={NAME_SORT_VALUES.map((sort) => ({
				value: sort,
				label: SORT_LABELS[sort],
			}))}
		/>
	);
}
