export function detectOpening(headers: Record<string, string>): string {
  return headers.Opening ?? (headers.ECO ? `ECO ${headers.ECO}` : "Opening not detected");
}

const COMMON_LINES = [
  "e2e4 e7e5 g1f3 b8c6 f1b5",
  "e2e4 e7e5 f1c4 b8c6",
  "e2e4 c7c5 g1f3",
  "e2e4 e7e6 d2d4 d7d5",
  "e2e4 c7c6 d2d4 d7d5",
  "d2d4 d7d5 c2c4",
  "d2d4 g8f6 c2c4 g7g6",
  "c2c4 e7e5",
  "g1f3 d7d5",
].flatMap((line) => { const moves = line.split(" "); return moves.map((_, index) => moves.slice(0, index + 1).join(" ")); });
const COMMON_PREFIXES = new Set(COMMON_LINES);

export function isCommonOpeningSequence(moves: string[]): boolean {
  return moves.length > 0 && COMMON_PREFIXES.has(moves.join(" "));
}
