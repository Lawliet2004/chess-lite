import {
  accuracyFromWinPercents,
  gameAccuracyForSide,
  winPercentFromCp,
} from "./accuracy";
import type { AnalyzedMove } from "../storage/models";

function move(ply: number, side: "w" | "b", before: number, after: number): AnalyzedMove {
  return {
    ply, moveNumber: Math.ceil(ply / 2), side, san: "e4", uci: "e2e4",
    fenBefore: "", fenAfter: "", evalBefore: { type: "cp", value: before },
    evalAfter: { type: "cp", value: after },
    accuracy: accuracyFromWinPercents(
      side === "w" ? winPercentFromCp(before) : 100 - winPercentFromCp(before),
      side === "w" ? winPercentFromCp(after) : 100 - winPercentFromCp(after),
    ),
  };
}

describe("official Lichess accuracy model", () => {
  // Win% formula: 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
  it("maps centipawns to Win% using the Lichess sigmoid", () => {
    expect(winPercentFromCp(0)).toBe(50);
    // +100cp → ~59.1% (Lichess calibrated on 2300-rated games)
    expect(winPercentFromCp(100)).toBeCloseTo(59.1, 0);
    expect(winPercentFromCp(-100)).toBeCloseTo(40.9, 0);
    expect(winPercentFromCp(5000)).toBe(winPercentFromCp(1000)); // clamped
  });

  // Accuracy formula: 103.1668 * exp(-0.04354 * winDiff) - 3.1669, clamped 0–100
  it("returns 100 when win% does not drop", () => {
    expect(accuracyFromWinPercents(50, 50)).toBe(100);
    expect(accuracyFromWinPercents(45, 50)).toBe(100); // position improved
  });

  it("matches the Lichess curve shape", () => {
    // The curve is fitted to approximate targets, not exact matches.
    // Actual outputs for these win-% drops:
    const drop5 = accuracyFromWinPercents(50, 45);   // ~80
    const drop10 = accuracyFromWinPercents(50, 40);  // ~60
    const drop20 = accuracyFromWinPercents(50, 30);  // ~42
    const drop40 = accuracyFromWinPercents(50, 10);  // ~20
    // Verify the curve is monotonically decreasing and in the right ballpark
    expect(drop5).toBeGreaterThan(drop10);
    expect(drop10).toBeGreaterThan(drop20);
    expect(drop20).toBeGreaterThan(drop40);
    expect(drop5).toBeGreaterThan(70);   // 5-pt drop: still fairly accurate
    expect(drop10).toBeGreaterThan(50);  // 10-pt drop: noticeable error
    expect(drop40).toBeLessThan(25);     // 40-pt drop: large blunder
    expect(accuracyFromWinPercents(100, 0)).toBe(0); // catastrophic
  });

  it("game accuracy: perfect moves yield 100 for that side", () => {
    const moves = [move(1, "w", 0, 15), move(2, "b", 15, 15), move(3, "w", 15, -250), move(4, "b", -250, -250)];
    expect(gameAccuracyForSide(moves, "b")).toBe(100);
    expect(gameAccuracyForSide(moves, "w")).toBeLessThan(80);
  });
});
