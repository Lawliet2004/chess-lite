import type { MoveClassification } from "../storage/models";

export type ClassificationInput = {
  cpLoss: number;
  wdlLoss: number;
  isBook?: boolean;
  isForced?: boolean;
  missedForcedMate?: boolean;
  allowedForcedMate?: boolean;
  unavoidableMate?: boolean;
  sacrifice?: boolean;
  isOnlyMove?: boolean;
  bestMove?: boolean;
  preservesAdvantage?: boolean;
};

export function classifyMove(input: ClassificationInput): MoveClassification {
  if (input.isBook) return "Book";
  if (input.isForced) return "Forced";
  if (input.missedForcedMate) return "Missed Win";
  if (input.allowedForcedMate && !input.unavoidableMate) return "Blunder";
  if (input.sacrifice && input.isOnlyMove && input.bestMove && input.cpLoss <= 10 && input.wdlLoss <= 0.01) {
    return "Brilliant Candidate";
  }
  if (input.isOnlyMove && input.bestMove && input.preservesAdvantage) return "Great Move";
  if (input.cpLoss > 300 || input.wdlLoss > 0.3) return "Blunder";
  if (input.cpLoss > 150 || input.wdlLoss > 0.15) return "Mistake";
  if (input.cpLoss > 70 || input.wdlLoss > 0.07) return "Inaccuracy";
  if (input.cpLoss > 30 || input.wdlLoss > 0.03) return "Good";
  if (input.cpLoss > 10 || input.wdlLoss > 0.01) return "Excellent";
  return "Best";
}
