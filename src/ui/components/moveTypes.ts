import type { MoveClassification } from "../../storage/models";

export type TimelineMoveType =
  | "Brilliant"
  | "Great"
  | "Book"
  | "Forced"
  | "Best"
  | "Excellent"
  | "Good"
  | "Inaccuracy"
  | "Mistake"
  | "Miss"
  | "Blunder";

export function getTimelineMoveType(classification: MoveClassification): TimelineMoveType {
  switch (classification) {
    case "Brilliant Candidate":
      return "Brilliant";
    case "Great Move":
      return "Great";
    case "Missed Win":
      return "Miss";
    default:
      return classification;
  }
}
