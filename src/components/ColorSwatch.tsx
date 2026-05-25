"use client";

interface ColorSwatchProps {
	color: string;
	className?: string;
	size?: "sm" | "md" | "lg";
	ariaLabel?: string;
}

const SIZE_MAP = {
	sm: "h-8 w-8",
	md: "h-12 w-12",
	lg: "h-20 w-20",
};

export default function ColorSwatch({
	color,
	className = "",
	size = "md",
	ariaLabel,
}: ColorSwatchProps) {
	return (
		<div
			className={`rounded-md shrink-0 ${SIZE_MAP[size]} ${!color ? "border border-border" : ""} ${className}`}
			style={{ background: color }}
			role="img"
			aria-label={ariaLabel ?? `Color ${color}`}
		/>
	);
}
