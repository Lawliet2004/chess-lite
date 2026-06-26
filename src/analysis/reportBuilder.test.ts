import { Chess } from "chess.js";
import { buildSummary, exportAnnotatedPgn } from "./reportBuilder";
import type { AnalyzedMove } from "../storage/models";

const move: AnalyzedMove = {
  ply: 1, moveNumber: 1, side: "w", san: "e4", uci: "e2e4",
  fenBefore: new Chess().fen(), fenAfter: new Chess().move("e4")!.after,
  bestMoveSan: "e4", evalAfter: { type: "cp", value: 22 }, cpLoss: 0,
  evalBefore: { type: "cp", value: 0 },
  wdlLoss: 0, accuracy: 100, classification: "Best", explanation: "Top engine move.",
};

describe("review reports", () => {
  it("builds per-side summary counts", () => {
    const summary = buildSummary([move], "King's Pawn Game");
    expect(summary.whiteAccuracy).toBe(100);
    expect(summary.counts.w.Best).toBe(1);
  });

  it("exports annotations as PGN comments, never markup", () => {
    const output = exportAnnotatedPgn("1. e4 *", [move]);
    expect(output).toContain("Classification: Best");
    expect(output).toContain("[%eval 0.22]");
    expect(output).not.toContain("<script");
  });
});
