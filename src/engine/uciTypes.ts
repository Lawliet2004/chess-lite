export type AnalyzeOptions = { depth?: number; movetimeMs?: number; multipv?: number };
export type EngineScore = { type: "cp"; value: number } | { type: "mate"; value: number };
export type EngineWdl = { win: number; draw: number; loss: number };
export type EngineLine = { multipv: number; score: EngineScore; wdl?: EngineWdl; pv: string[]; depth: number };
export type EngineAnalysis = {
  bestMove: string;
  ponder?: string;
  depth: number;
  seldepth?: number;
  score: EngineScore;
  wdl?: EngineWdl;
  pv: string[];
  nodes?: number;
  nps?: number;
  timeMs?: number;
  multipv?: EngineLine[];
};

export interface EngineClient {
  init(): Promise<void>;
  isReady(): Promise<void>;
  newGame(): Promise<void>;
  setPositionFen(fen: string): Promise<void>;
  analyze(options: AnalyzeOptions): Promise<EngineAnalysis>;
  stop(): Promise<void>;
  quit(): Promise<void>;
}
