"use client";

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

interface NamesSearchProps {
	value: string;
	onValueChange: (value: string) => void;
}

export default function NamesSearch({
	value,
	onValueChange,
}: NamesSearchProps) {
	return (
		<div
			className="relative w-full max-w-md"
			role="search"
		>
			<MagnifyingGlassIcon
				size={14}
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
				aria-hidden
			/>
			<input
				type="text"
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				placeholder="Search names or #hex"
				className="h-9 w-full border border-border bg-transparent py-1.5 pl-9 pr-9 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ring"
				spellCheck={false}
				autoComplete="off"
				aria-label="Search color names or HEX values"
			/>
			{value && (
				<button
					type="button"
					onClick={() => onValueChange("")}
					className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-muted-foreground transition-colors hover:text-foreground"
					aria-label="Clear search"
				>
					<XIcon size={14} />
				</button>
			)}
		</div>
	);
}
