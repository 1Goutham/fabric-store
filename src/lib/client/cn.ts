/** Tiny className joiner. Tailwind v4 handles conflicts well enough for this codebase. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
