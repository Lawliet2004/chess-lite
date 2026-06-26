import { BookOpen, Check, Star, ThumbsUp, X } from "lucide-react";
import type { ReactNode } from "react";
import type { MoveClassification } from "../../storage/models";
import type { TimelineMoveType } from "./moveTypes";
import { getTimelineMoveType } from "./moveTypes";

const CLASSIFICATION_WIDGETS: Record<TimelineMoveType, { icon: ReactNode; label: TimelineMoveType }> = {
  Brilliant: { icon: "!!", label: "Brilliant" },
  Great: { icon: "!", label: "Great" },
  Book: { icon: <BookOpen aria-hidden="true" />, label: "Book" },
  Forced: { icon: "F", label: "Forced" },
  Best: { icon: <Star aria-hidden="true" fill="currentColor" />, label: "Best" },
  Excellent: { icon: <ThumbsUp aria-hidden="true" fill="currentColor" />, label: "Excellent" },
  Good: { icon: <Check aria-hidden="true" />, label: "Good" },
  Inaccuracy: { icon: "?!", label: "Inaccuracy" },
  Mistake: { icon: "?", label: "Mistake" },
  Miss: { icon: <X aria-hidden="true" />, label: "Miss" },
  Blunder: { icon: "??", label: "Blunder" },
};

export function MoveTypeWidget({
  classification,
  className = "",
}: {
  classification?: MoveClassification;
  className?: string;
}) {
  if (!classification) return null;
  const moveType = getTimelineMoveType(classification);
  const widget = CLASSIFICATION_WIDGETS[moveType];

  return (
    <span
      className={`move-type-widget ${moveType}${className ? ` ${className}` : ""}`}
      aria-label={widget.label}
      title={widget.label}
    >
      {widget.icon}
    </span>
  );
}
