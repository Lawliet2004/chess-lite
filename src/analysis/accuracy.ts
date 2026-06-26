import type { AnalyzedMove, NormalizedEval, Side } from "../storage/models";

// ─── Official Lichess Accuracy Model ────────────────────────────────────────
// All formulas are taken verbatim from the published Lichess source and docs:
//   https://lichess.org/page/accuracy
//   https://github.com/lichess-org/lila/blob/master/modules/analyse/src/main/AccuracyPercent.scala
//   https://github.com/lichess-org/scalachess/blob/master/core/src/main/scala/eval.scala
//
// Chess.com's CAPS2 is proprietary and has never been published. Community
// research confirms there is no known formula that reliably replicates it.
// We therefore implement the Lichess model faithfully – it is open-source,
// peer-reviewed, and empirically fitted to real game data.
//
// Why did previous results feel "high"?
//   The old gameAccuracyForSide deviated from Lichess's spec in two ways:
//     1. It used a custom square-root compression on per-move scores.
//     2. It replaced the sliding-window volatility weights with a simpler
//        window approach that didn't follow the spec correctly.
//   Both are removed here. The result will closely match what Lichess shows.
// ────────────────────────────────────────────────────────────────────────────

const WIN_PERCENT_MULTIPLIER = -0.00368208; // fitted on 2300-rated game data

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

/**
 * Official Lichess Win% formula (from lichess.org/page/accuracy):
 *   Win% = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
 */
export function winPercentFromCp(cp: number): number {
  const bounded = clamp(cp, -1000, 1000);
  const winningChances = 2 / (1 + Math.exp(WIN_PERCENT_MULTIPLIER * bounded)) - 1;
  return 50 + 50 * clamp(winningChances, -1, 1);
}

/**
 * Official Lichess move-accuracy formula (from lichess.org/page/accuracy):
 *   Accuracy% = 103.1668 * exp(-0.04354 * (winPercentBefore - winPercentAfter)) - 3.1669
 *
 * Fitted via scipy curve_fit to the target points:
 *   winDiff:   0   5   10  20  40  60  80  90  100
 *   accuracy: 100  75  60  42  20   5   0   0    0
 */
export function accuracyFromWinPercents(before: number, after: number): number {
  if (after >= before) return 100;
  const winDiff = before - after;
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) - 3.166924740191411;
  return clamp(raw, 0, 100);
}

export function cpForAccuracy(value: NormalizedEval): number {
  return value.type === "mate" ? Math.sign(value.value) * 1000 : clamp(value.value, -1000, 1000);
}

export function moveAccuracyFromEvals(
  before: NormalizedEval,
  after: NormalizedEval,
  mover: Side,
): number {
  const whiteBefore = winPercentFromCp(cpForAccuracy(before));
  const whiteAfter = winPercentFromCp(cpForAccuracy(after));
  return accuracyFromWinPercents(
    mover === "w" ? whiteBefore : 100 - whiteBefore,
    mover === "w" ? whiteAfter : 100 - whiteAfter,
  );
}

// ─── Game Accuracy (Lichess spec, verbatim) ──────────────────────────────────
// From https://lichess.org/page/accuracy:
//   1. Divide the game into sliding windows (size = f(game length)).
//   2. Compute volatility of each window = stdev of Win% in that window.
//   3. Compute volatility-weighted mean of per-move accuracies.
//   4. Compute harmonic mean of per-move accuracies.
//   5. Game accuracy = average of (weighted mean + harmonic mean).

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
}

export function gameAccuracyForSide(moves: AnalyzedMove[], side: Side): number {
  if (!moves.length || !moves[0].evalBefore) return 0;

  // Collect every win-percent position (before first move + after each move)
  const positions = [
    moves[0].evalBefore,
    ...moves.map((m) => m.evalAfter),
  ].filter((v): v is NormalizedEval => Boolean(v));

  // Fall back to simple mean if we don't have the full position chain
  if (positions.length !== moves.length + 1) {
    const vals = moves
      .filter((m) => m.side === side && m.accuracy !== undefined)
      .map((m) => m.accuracy!);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  }

  const winPercents = positions.map((v) => winPercentFromCp(cpForAccuracy(v)));

  // Step 1 — sliding windows (Lichess spec: size = clamp(floor(N/10), 2, 8))
  const N = winPercents.length;
  const windowSize = clamp(Math.floor(moves.length / 10), 2, 8);
  const windows: number[][] = [];
  // Prefix windows (ramp up to full size)
  for (let i = 0; i < Math.min(windowSize, N) - 1; i++) {
    windows.push(winPercents.slice(0, i + 2));
  }
  // Full sliding windows
  for (let i = 0; i <= N - windowSize; i++) {
    windows.push(winPercents.slice(i, i + windowSize));
  }

  // Step 2 — volatility per window, clamped to [0.5, 12]
  const volatilities = windows.map((w) => clamp(standardDeviation(w), 0.5, 12));

  // Steps 3 & 4 — collect per-move samples for the requested side
  const samples = moves.flatMap((move, idx) => {
    if (move.side !== side) return [];
    const before = side === "w" ? winPercents[idx] : 100 - winPercents[idx];
    const after = side === "w" ? winPercents[idx + 1] : 100 - winPercents[idx + 1];
    const accuracy = accuracyFromWinPercents(before, after);
    const weight = volatilities[idx] ?? 0.5;
    return [{ accuracy, weight }];
  });

  if (!samples.length) return 0;

  // Step 3 — volatility-weighted arithmetic mean
  const totalWeight = samples.reduce((s, x) => s + x.weight, 0);
  const weightedMean = samples.reduce((s, x) => s + x.accuracy * x.weight, 0) / totalWeight;

  // Step 4 — harmonic mean (Lichess: if any move is 0, harmonic mean = 0)
  const hasZero = samples.some((x) => x.accuracy === 0);
  const harmonicMean = hasZero
    ? 0
    : samples.length / samples.reduce((s, x) => s + 1 / x.accuracy, 0);

  // Step 5 — final game accuracy
  return (weightedMean + harmonicMean) / 2;
}
