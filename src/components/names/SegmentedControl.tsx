"use client";

interface SegmentOption<T extends string> {
	value: T;
	label: string;
	count?: number;
}

interface SegmentedControlProps<T extends string> {
	label: string;
	value: T;
	options: readonly SegmentOption<T>[];
	onValueChange: (value: T) => void;
	disabled?: boolean;
	disabledHint?: string;
}

export default function SegmentedControl<T extends string>({
	label,
	value,
	options,
	onValueChange,
	disabled,
	disabledHint,
}: SegmentedControlProps<T>) {
	return (
		<div
			className="inline-flex w-fit border border-border"
			role="group"
			aria-label={label}
			title={disabled ? disabledHint : undefined}
		>
			{options.map((option, index) => {
				const active = option.value === value;

				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onValueChange(option.value)}
						disabled={disabled}
						aria-pressed={active}
						className={`h-9 cursor-pointer px-2.5 font-mono text-[11px] uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
							index > 0 ? "border-l border-border" : ""
						} ${
							active
								? "bg-foreground text-background"
								: "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
						}`}
					>
						{option.label}
						{option.count !== undefined && (
							<span
								className={`ml-1.5 text-[10px] tabular-nums ${
									active ? "text-background/60" : "text-muted-foreground/50"
								}`}
							>
								{option.count}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
