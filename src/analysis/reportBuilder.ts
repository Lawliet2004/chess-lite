import { Chess } from "chess.js";
import type { AnalyzedMove, GameSummary, MoveClassification, Side } from "../storage/models";
import { formatEval } from "./evalNormalization";
import { gameAccuracyForSide } from "./accuracy";
import { estimatePerformanceRating } from "./performanceRating";

function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function buildSummary(moves: AnalyzedMove[], opening = "Opening not detected"): GameSummary {
  const forSide = (side: Side) => moves.filter((move) => move.side === side);
  const counts = (side: Side) => forSide(side).reduce<Partial<Record<MoveClassification, number>>>((acc, move) => {
    if (move.classification) acc[move.classification] = (acc[move.classification] ?? 0) + 1;
    return acc;
  }, {});
  const whiteAccuracy = gameAccuracyForSide(moves, "w");
  const blackAccuracy = gameAccuracyForSide(moves, "b");
  const decisive = [...moves].filter((move) => move.wdlLoss !== undefined).sort((a, b) => (b.wdlLoss ?? 0) - (a.wdlLoss ?? 0))[0];
  return {
    whiteAccuracy,
    blackAccuracy,
    quality: mean([whiteAccuracy, blackAccuracy]),
    whiteAverageCpLoss: mean(forSide("w").flatMap((move) => move.cpLoss === undefined ? [] : [Math.min(1000, move.cpLoss)])),
    blackAverageCpLoss: mean(forSide("b").flatMap((move) => move.cpLoss === undefined ? [] : [Math.min(1000, move.cpLoss)])),
    opening,
    counts: { w: counts("w"), b: counts("b") },
    decisivePly: decisive?.ply,
    whitePerformance: estimatePerformanceRating(forSide("w")),
    blackPerformance: estimatePerformanceRating(forSide("b")),
  };
}

function safeComment(value: string): string {
  return value.replace(/[{}<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 600);
}

export function exportAnnotatedPgn(pgn: string, moves: AnalyzedMove[]): string {
  const source = new Chess();
  source.loadPgn(pgn, { strict: false });
  const history = source.history({ verbose: true });
  const headers = Object.fromEntries(Object.entries(source.header()).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const output = headers.FEN ? new Chess(headers.FEN) : new Chess();
  const pairs = Object.entries(headers).flat();
  if (pairs.length) output.header(...pairs);

  history.forEach((move, index) => {
    output.move({ from: move.from, to: move.to, promotion: move.promotion });
    const review = moves[index];
    if (!review) return;
    const evalTag = review.evalAfter?.type === "cp" ? `[%eval ${(review.evalAfter.value / 100).toFixed(2)}]` : `[%eval ${formatEval(review.evalAfter)}]`;
    output.setComment(safeComment(`${evalTag} Best move: ${review.bestMoveSan ?? review.bestMoveUci ?? "—"}. Classification: ${review.classification ?? "Unclassified"}. ${review.explanation ?? ""}`));
  });
  return output.pgn({ maxWidth: 100, newline: "\n" });
}

export function exportAnalysisJson(game: unknown): string {
  return JSON.stringify(game, null, 2);
}
