export function userName(pk: number): string {
  return `#User ${String(pk).padStart(3, '0')}`;
}