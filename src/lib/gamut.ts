import { displayable } from "culori";

export function isOutOfGamut(value: string): boolean {
  if (!value) return false;
  try {
    return !displayable(value);
  } catch {
    return false;
  }
}
