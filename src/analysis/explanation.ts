import type { AnalyzedMove } from "../storage/models";
import { formatEval } from "./evalNormalization";

export function explainMove(move: AnalyzedMove): string {
  const best = move.bestMoveSan ?? move.bestMoveUci ?? "the engine line";
  if (move.classification === "Book") return "This is a recognized opening move and is not penalized by the review.";
  if (move.classification === "Missed Win") return `This move missed a forcing win. ${best} kept the decisive continuation.`;
  if (move.evalAfter?.type === "mate" && ((move.side === "w" && move.evalAfter.value < 0) || (move.side === "b" && move.evalAfter.value > 0))) {
    return `This move allows forced mate (${formatEval(move.evalAfter)}). Stockfish preferred ${best}.`;
  }
  if (["Blunder", "Mistake"].includes(move.classification ?? "")) return `This move causes a major evaluation swing. ${best} was the stronger continuation.`;
  if (move.classification === "Best" || move.classification === "Forced") return `This matches the engine's top choice and preserves the position.`;
  return `${best} was more precise, reducing the evaluation loss from this move.`;
}
