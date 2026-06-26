import type { EngineAnalysis, EngineClient } from "../engine/uciTypes";
import { Chess } from "chess.js";
import { uciToSan } from "../chess/sanUciConverter";
import { reconstructGame } from "../chess/gameReconstructor";
import type { AnalyzedMove, NormalizedEval, ReviewSettings } from "../storage/models";
import { moveAccuracyFromEvals } from "./accuracy";
import { cpLossForMover, normalizeEngineScore } from "./evalNormalization";
import { explainMove } from "./explanation";
import { classifyMove } from "./moveClassifier";
import { isCommonOpeningSequence } from "./openingDetector";
import { detectTacticalTags } from "./tacticDetector";
import { engineWdlLossForMover, wdlLossForMover } from "./wdl";

export type AnalysisProgress = { completed: number; total: number; currentPly: number; moves: AnalyzedMove[] };
export type AnalysisControl = { signal?: AbortSignal; onProgress?: (progress: AnalysisProgress) => void };

function cpValue(value: NormalizedEval): number { return value.type === "cp" ? value.value : Math.sign(value.value) * 100_000; }

export function terminalAnalysisForFen(fen: string): EngineAnalysis | undefined {
  const chess = new Chess(fen);
  if (!chess.isGameOver()) return undefined;
  return {
    bestMove: "(none)", depth: 0, pv: [],
    score: chess.isCheckmate() ? { type: "mate", value: -1 } : { type: "cp", value: 0 },
    wdl: chess.isCheckmate() ? { win: 0, draw: 0, loss: 1000 } : { win: 0, draw: 1000, loss: 0 },
  };
}

export class GameAnalyzer {
  private cache = new Map<string, EngineAnalysis>();
  constructor(private readonly engine: EngineClient) {}

  async analyzePgn(pgn: string, settings: ReviewSettings, control: AnalysisControl = {}): Promise<AnalyzedMove[]> {
    const positions = reconstructGame(pgn);
    const analyzed: AnalyzedMove[] = [];
    await this.engine.init();
    await this.engine.newGame();

    for (const position of positions) {
      if (control.signal?.aborted) { await this.engine.stop(); throw new DOMException("Analysis stopped", "AbortError"); }
      const beforeRaw = await this.analyzeFen(position.fenBefore, settings);
      const afterRaw = await this.analyzeFen(position.fenAfter, settings);
      const before = normalizeEngineScore(beforeRaw.score, position.side);
      const afterSide = position.side === "w" ? "b" : "w";
      const after = normalizeEngineScore(afterRaw.score, afterSide);
      const cpLoss = cpLossForMover(before, after, position.side);
      const wdlLoss = settings.useWdl && beforeRaw.wdl && afterRaw.wdl
        ? engineWdlLossForMover(beforeRaw.wdl, afterRaw.wdl)
        : wdlLossForMover(cpValue(before), cpValue(after), position.side);
      const bestMoveSan = uciToSan(position.fenBefore, beforeRaw.bestMove);
      const isBest = position.uci === beforeRaw.bestMove;
      const missedForcedMate = before.type === "mate" && ((position.side === "w" && before.value > 0) || (position.side === "b" && before.value < 0)) && after.type !== "mate";
      const allowedForcedMate = after.type === "mate" && ((position.side === "w" && after.value < 0) || (position.side === "b" && after.value > 0));
      const move: AnalyzedMove = {
        ...position,
        bestMoveUci: beforeRaw.bestMove,
        bestMoveSan,
        evalBefore: before,
        evalAfter: after,
        cpLoss,
        wdlLoss,
        accuracy: moveAccuracyFromEvals(before, after, position.side),
        classification: classifyMove({ cpLoss, wdlLoss, bestMove: isBest, isBook: settings.includeOpeningBook && isCommonOpeningSequence([...analyzed.map((prior) => prior.uci), position.uci]), missedForcedMate, allowedForcedMate }),
        pv: beforeRaw.pv,
        tags: detectTacticalTags(position.fenBefore, position.uci),
      };
      move.explanation = explainMove(move);
      analyzed.push(move);
      control.onProgress?.({ completed: analyzed.length, total: positions.length, currentPly: position.ply, moves: [...analyzed] });
    }
    return analyzed;
  }

  private async analyzeFen(fen: string, settings: ReviewSettings): Promise<EngineAnalysis> {
    const terminal = terminalAnalysisForFen(fen);
    if (terminal) return terminal;
    const options = settings.depth ? { depth: settings.depth, multipv: settings.multipv } : { movetimeMs: settings.movetimeMs ?? 350, multipv: settings.multipv };
    const key = `${fen}|${JSON.stringify(options)}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    await this.engine.setPositionFen(fen);
    const result = await this.engine.analyze(options);
    this.cache.set(key, result);
    return result;
  }
}
