import { Chess } from "chess.js";

export function detectTacticalTags(fen: string, uci: string): string[] {
  const chess = new Chess(fen);
  const target = chess.get(uci.slice(2, 4) as never);
  let move;
  try { move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }); } catch { return []; }
  if (!move) return [];
  const tags: string[] = [];
  if (move.isCapture()) tags.push("Capture");
  if (move.isPromotion()) tags.push("Promotion");
  if (chess.inCheck()) tags.push(chess.isCheckmate() ? "Mate threat" : "Check");
  if (target?.type === "q") tags.push("Queen trade");
  const movingPiece = chess.get(uci.slice(2, 4) as never);
  if (move.isCapture() && movingPiece && target && movingPiece.type !== "p" && !target) tags.push("Sacrifice candidate");
  return tags;
}
