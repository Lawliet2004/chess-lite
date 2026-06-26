export type GameSource = "chess.com" | "lichess" | "manual";
export type Side = "w" | "b";
export type MoveClassification =
  | "Book"
  | "Forced"
  | "Best"
  | "Excellent"
  | "Good"
  | "Inaccuracy"
  | "Mistake"
  | "Blunder"
  | "Missed Win"
  | "Great Move"
  | "Brilliant Candidate";

export type NormalizedEval =
  | { type: "cp"; value: number }
  | { type: "mate"; value: number };

export type ReviewSettings = {
  mode: "fast" | "balanced" | "deep" | "custom";
  depth?: number;
  movetimeMs?: number;
  multipv: number;
  useWdl: boolean;
  includeOpeningBook: boolean;
  saveReviews: boolean;
};

export type AnalyzedMove = {
  ply: number;
  moveNumber: number;
  side: Side;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  bestMoveUci?: string;
  bestMoveSan?: string;
  evalBefore?: NormalizedEval;
  evalAfter?: NormalizedEval;
  cpLoss?: number;
  wdlLoss?: number;
  accuracy?: number;
  classification?: MoveClassification;
  pv?: string[];
  explanation?: string;
  tags?: string[];
};

export type GameSummary = {
  whiteAccuracy: number;
  blackAccuracy: number;
  whiteAverageCpLoss: number;
  blackAverageCpLoss: number;
  quality: number;
  opening: string;
  counts: Record<Side, Partial<Record<MoveClassification, number>>>;
  decisivePly?: number;
  whitePerformance: PerformanceEstimate;
  blackPerformance: PerformanceEstimate;
};

export type PerformanceEstimate = {
  rating: number;
  low: number;
  high: number;
  confidence: "low" | "medium";
  sampleMoves: number;
};

export type StoredGame = {
  id: string;
  source: GameSource;
  url?: string;
  pgn: string;
  white: string;
  black: string;
  result: string;
  date?: string;
  timeControl?: string;
  createdAt: number;
  updatedAt: number;
  reviewSettings: ReviewSettings;
  summary: GameSummary;
  moves: AnalyzedMove[];
};
