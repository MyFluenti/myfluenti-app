/** Junta partes de um accessibilityLabel com ". ", sem pontuação final duplicada. */
export function joinLabel(...parts: (string | undefined | null)[]): string {
  return parts
    .map((p) => (p ?? '').trim().replace(/[.!?…:;,]+$/u, ''))
    .filter((p) => p.length > 0)
    .join('. ');
}
