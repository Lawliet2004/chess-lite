import { Chess } from "chess.js";
import type { Side } from "../storage/models";
import { parsePgn } from "./pgnParser";

export type ReconstructedMove = {
  ply: number;
  moveNumber: number;
  side: Side;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
};

export function reconstructGame(pgn: string): ReconstructedMove[] {
  const parsed = parsePgn(pgn);
  const startFen = parsed.headers.FEN;
  const chess = startFen ? new Chess(startFen) : new Chess();
  return parsed.moves.map((sourceMove, index) => {
    const fenBefore = chess.fen();
    const side = chess.turn() as Side;
    const move = chess.move({ from: sourceMove.from, to: sourceMove.to, promotion: sourceMove.promotion });
    if (!move) throw new Error(`Invalid move at ply ${index + 1}`);
    return {
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      side,
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion ?? ""}`,
      fenBefore,
      fenAfter: chess.fen(),
    };
  });
}
