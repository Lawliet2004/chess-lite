import type { EngineScore } from "../engine/uciTypes";
import type { NormalizedEval, Side } from "../storage/models";

export function normalizeEngineScore(score: EngineScore, sideToMove: Side): NormalizedEval {
  const value = sideToMove === "w" ? score.value : -score.value;
  return { type: score.type, value } as NormalizedEval;
}

function cpEquivalent(value: NormalizedEval): number {
  if (value.type === "cp") return value.value;
  return Math.sign(value.value) * 100_000;
}

export function cpLossForMover(before: NormalizedEval, after: NormalizedEval, mover: Side): number {
  const signedLoss = mover === "w"
    ? cpEquivalent(before) - cpEquivalent(after)
    : cpEquivalent(after) - cpEquivalent(before);
  return Math.max(0, signedLoss);
}

export function graphValue(value: NormalizedEval, capPawns = 10): number {
  if (value.type === "mate") return Math.sign(value.value) * capPawns;
  return Math.max(-capPawns, Math.min(capPawns, value.value / 100));
}

export function formatEval(value?: NormalizedEval): string {
  if (!value) return "—";
  if (value.type === "mate") return `M${value.value > 0 ? "+" : ""}${value.value}`;
  return `${value.value >= 0 ? "+" : ""}${(value.value / 100).toFixed(2)}`;
}
