import type { EngineWdl } from "../engine/uciTypes";
import type { Side } from "../storage/models";

export type Wdl = { win: number; draw: number; loss: number };

export function cpToWinProbability(cp: number): number {
  const bounded = Math.max(-1000, Math.min(1000, cp));
  return 1 / (1 + Math.exp(-bounded / 240));
}

export function cpToWdl(cp: number): Wdl {
  const decisive = Math.abs(cp) / 1000;
  const draw = Math.max(0, 0.62 * (1 - decisive));
  const whiteWin = cpToWinProbability(cp);
  const remaining = 1 - draw;
  return { win: remaining * whiteWin, draw, loss: remaining * (1 - whiteWin) };
}

export function expectedScore(wdl: Wdl, side: Side): number {
  const white = wdl.win + 0.5 * wdl.draw;
  return side === "w" ? white : 1 - white;
}

export function wdlLossForMover(beforeCp: number, afterCp: number, side: Side): number {
  return Math.max(0, expectedScore(cpToWdl(beforeCp), side) - expectedScore(cpToWdl(afterCp), side));
}

export function engineWdlLossForMover(before: EngineWdl, after: EngineWdl): number {
  const beforeExpected = (before.win + 0.5 * before.draw) / 1000;
  const afterMoverExpected = (after.loss + 0.5 * after.draw) / 1000;
  return Math.max(0, beforeExpected - afterMoverExpected);
}
