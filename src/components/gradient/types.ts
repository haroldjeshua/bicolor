export type GradientType = "linear" | "radial" | "angular";

export interface GradientStop {
	id: string;
	color: string;
	position: number;
}
