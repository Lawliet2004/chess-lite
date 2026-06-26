import type { EngineLine, EngineScore } from "./uciTypes";

export type ParsedInfo = EngineLine & { seldepth?: number; nodes?: number; nps?: number; timeMs?: number };

function numberAfter(tokens: string[], key: string): number | undefined {
  const index = tokens.indexOf(key);
  if (index < 0) return undefined;
  const value = Number(tokens[index + 1]);
  return Number.isFinite(value) ? value : undefined;
}

export function parseInfoLine(line: string): ParsedInfo | undefined {
  const tokens = line.trim().split(/\s+/);
  if (tokens[0] !== "info") return undefined;
  const depth = numberAfter(tokens, "depth");
  const scoreIndex = tokens.indexOf("score");
  const pvIndex = tokens.indexOf("pv");
  if (depth === undefined || scoreIndex < 0 || pvIndex < 0) return undefined;
  const scoreType = tokens[scoreIndex + 1];
  const scoreValue = Number(tokens[scoreIndex + 2]);
  if ((scoreType !== "cp" && scoreType !== "mate") || !Number.isFinite(scoreValue)) return undefined;
  const wdlIndex = tokens.indexOf("wdl");
  const wdlValues = wdlIndex >= 0 ? tokens.slice(wdlIndex + 1, wdlIndex + 4).map(Number) : [];
  const wdl = wdlValues.length === 3 && wdlValues.every(Number.isFinite)
    ? { win: wdlValues[0], draw: wdlValues[1], loss: wdlValues[2] }
    : undefined;
  return {
    depth,
    seldepth: numberAfter(tokens, "seldepth"),
    multipv: numberAfter(tokens, "multipv") ?? 1,
    score: { type: scoreType, value: scoreValue } as EngineScore,
    wdl,
    nodes: numberAfter(tokens, "nodes"),
    nps: numberAfter(tokens, "nps"),
    timeMs: numberAfter(tokens, "time"),
    pv: tokens.slice(pvIndex + 1).filter((move) => /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)),
  };
}

export function parseBestMove(line: string): { bestMove: string; ponder?: string } | undefined {
  const match = line.trim().match(/^bestmove\s+(\S+)(?:\s+ponder\s+(\S+))?/);
  return match ? { bestMove: match[1], ponder: match[2] } : undefined;
}

export function createAccumulator() {
  const byIndex = new Map<number, ParsedInfo>();
  return {
    push(info: ParsedInfo) {
      const current = byIndex.get(info.multipv);
      if (!current || info.depth >= current.depth) byIndex.set(info.multipv, info);
    },
    lines: () => [...byIndex.values()].sort((a, b) => a.multipv - b.multipv),
  };
}
