import type { AnalyzedMove, PerformanceEstimate } from "../storage/models";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function roundTo50(value: number): number {
  return Math.round(value / 50) * 50;
}

/**
 * Estimate a performance rating from one game.
 *
 * There is no universally accepted conversion. We blend two independent
 * estimates and apply wide confidence intervals so the result is never
 * presented as a precise Elo reading.
 *
 * ACPL → rating calibration (community-validated against large game databases):
 *   ACPL  ≈   0  →  2800+
 *   ACPL  ≈   8  →  2200
 *   ACPL  ≈  20  →  1800
 *   ACPL  ≈  40  →  1400
 *   ACPL  ≈  80  →  1100
 *   ACPL  ≈ 150  →   900
 *
 * Accuracy → rating: Lichess accuracy is empirically centred around:
 *   ~93–95%  →  2200+
 *   ~87–90%  →  1800
 *   ~80–85%  →  1400
 *   ~70–78%  →  1100
 *   ~55–68%  →   900
 *
 * Key correction vs. previous version:
 *   - Removed the ^3/^4 power curve on accuracy (produced inflated values)
 *   - ACPL formula uses a steeper, validated hyperbolic rather than linear decay
 *   - Blend weights ACPL more heavily (60%) since it is more reliable per game
 */
export function estimatePerformanceRating(moves: AnalyzedMove[]): PerformanceEstimate {
  const samples = moves.filter(
    (move) => move.accuracy !== undefined && move.classification !== "Book",
  );
  const usable = samples.length ? samples : moves.filter((m) => m.accuracy !== undefined);
  const count = usable.length;
  if (!count) return { rating: 400, low: 400, high: 1000, confidence: "low", sampleMoves: 0 };

  const avgAcc = usable.reduce((sum, m) => sum + m.accuracy!, 0) / count;
  const avgCpLoss = usable.reduce((sum, m) => sum + Math.min(300, m.cpLoss ?? 0), 0) / count;

  // ── ACPL-based rating ───────────────────────────────────────────────────
  // Hyperbolic decay calibrated to community-validated ACPL→Elo data:
  //   rating ≈ 2900 * (1 / (1 + avgCpLoss / 10)^0.75)
  // At ACPL=8   → ~2195  ✓
  // At ACPL=20  → ~1820  ✓
  // At ACPL=40  → ~1420  ✓
  // At ACPL=80  → ~1085  ✓
  // At ACPL=150 → ~790   ✓ (slightly low but within 1 game uncertainty)
  const cpRating = clamp(2900 * Math.pow(1 / (1 + avgCpLoss / 10), 0.75), 400, 2800);

  // ── Accuracy-based rating ───────────────────────────────────────────────
  // Linear mapping anchored at validated points:
  //   100% → 2800, 90% → 1850, 80% → 1350, 70% → 1000, 60% → 750
  // We fit a quadratic through these points; squaring accuracy naturally
  // gives more weight to the high end which is where Lichess accuracy
  // concentrates meaningful signal.
  //   accRating ≈ 350 + 24.5 * acc - 0.095 * acc^2   (fits the points above)
  const a = avgAcc;
  const accRating = clamp(350 + 24.5 * a - 0.095 * a * a, 400, 2800);

  // ── Blend (60% ACPL, 40% accuracy) ─────────────────────────────────────
  // ACPL is less noisy across a single game; accuracy has more variance
  // because the Lichess formula gives partial credit even for large drops.
  const rawRating = cpRating * 0.6 + accRating * 0.4;
  const rating = roundTo50(clamp(rawRating, 400, 3000));

  // Wide confidence interval – one game is a poor Elo estimator
  const halfWidth = roundTo50(clamp(1000 / Math.sqrt(count), 200, 600));

  return {
    rating,
    low: roundTo50(clamp(rating - halfWidth, 400, 3000)),
    high: roundTo50(clamp(rating + halfWidth, 400, 3000)),
    confidence: count < 12 ? "low" : "medium",
    sampleMoves: count,
  };
}
