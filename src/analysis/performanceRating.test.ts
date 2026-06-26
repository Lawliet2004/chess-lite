import { estimatePerformanceRating } from "./performanceRating";
import type { AnalyzedMove } from "../storage/models";

function sample(count: number, accuracy: number, cpLoss: number): AnalyzedMove[] {
  return Array.from({ length: count }, (_, index) => ({
    ply: index * 2 + 1, moveNumber: index + 1, side: "w" as const,
    san: "Nf3", uci: "g1f3", fenBefore: "", fenAfter: "",
    accuracy, cpLoss, classification: cpLoss > 150 ? "Mistake" as const : "Good" as const,
  }));
}

describe("estimated game performance", () => {
  it("is monotonic with stronger move quality", () => {
    const strong = estimatePerformanceRating(sample(20, 96, 18));
    const weak = estimatePerformanceRating(sample(20, 58, 145));
    expect(strong.rating).toBeGreaterThan(weak.rating);
    expect(strong.low).toBeLessThanOrEqual(strong.rating);
    expect(strong.high).toBeGreaterThanOrEqual(strong.rating);
  });

  it("reports wider uncertainty for a short game", () => {
    const short = estimatePerformanceRating(sample(4, 85, 45));
    const long = estimatePerformanceRating(sample(30, 85, 45));
    expect(short.confidence).toBe("low");
    expect(short.high - short.low).toBeGreaterThan(long.high - long.low);
  });

  it("clamps the estimate within a sensible Elo range", () => {
    const perfect = estimatePerformanceRating(sample(20, 100, 0));
    const terrible = estimatePerformanceRating(sample(20, 0, 1000));
    // Perfect play should produce a high rating
    expect(perfect.rating).toBeGreaterThan(2000);
    // Terrible play floors at 400
    expect(terrible.low).toBe(400);
    expect(terrible.rating).toBe(400);
    // Both bounds must be within the valid Elo range
    expect(perfect.high).toBeLessThanOrEqual(3000);
    expect(terrible.low).toBeGreaterThanOrEqual(400);
  });
});
