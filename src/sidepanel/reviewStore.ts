import { create } from "zustand";
import type { AnalyzedMove, GameSummary, ReviewSettings } from "../storage/models";

export const defaultSettings: ReviewSettings = { mode: "balanced", depth: 13, multipv: 2, useWdl: true, includeOpeningBook: true, saveReviews: true };

type ReviewState = {
  pgn: string;
  moves: AnalyzedMove[];
  summary?: GameSummary;
  selectedPly: number;
  settings: ReviewSettings;
  analyzing: boolean;
  progress: number;
  error?: string;
  set: (patch: Partial<Omit<ReviewState, "set">>) => void;
  reset: () => void;
};

export const useReviewStore = create<ReviewState>((set) => ({
  pgn: "", moves: [], selectedPly: 0, settings: defaultSettings, analyzing: false, progress: 0,
  set,
  reset: () => set({ pgn: "", moves: [], summary: undefined, selectedPly: 0, analyzing: false, progress: 0, error: undefined }),
}));
