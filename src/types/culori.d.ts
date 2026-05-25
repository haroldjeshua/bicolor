declare module "culori" {
  export interface Color {
    mode: string;
    r?: number;
    g?: number;
    b?: number;
    alpha?: number;
    l?: number;
    a?: number;
    b?: number;
    c?: number;
    h?: number;
    s?: number;
  }

  export function parse(color: string): Color | null;

  export function formatHex(color: Color): string;
  export function formatRgb(color: Color): string;
  export function formatHsl(color: Color): string;
  export function formatCss(color: Color): string;

  export function converter(
    mode: string
  ): (color: Color) => Color;

  export function clampChroma(
    color: Color,
    mode?: string,
    rgbGamut?: string
  ): Color;

  export function toGamut(params: {
    mode: string;
    method?: string;
  }): (color: Color) => Color;

  export function interpolate(
    colors: Color[],
    mode: string,
    options?: Record<string, unknown>
  ): (t: number) => Color;

  export function samples(n: number): number[];
}
