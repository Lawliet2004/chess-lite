import { Chess } from "chess.js";

export type GamePhase = "opening" | "middlegame" | "endgame";

export function detectPhase(fen: string, ply: number): GamePhase {
  if (ply <= 16) return "opening";
  const chess = new Chess(fen);
  const nonPawnValue = chess.board().flat().reduce((sum, piece) => sum + (piece ? ({ q: 9, r: 5, b: 3, n: 3, p: 0, k: 0 }[piece.type]) : 0), 0);
  return nonPawnValue <= 20 ? "endgame" : "middlegame";
}
