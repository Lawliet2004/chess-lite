import type { MoveClassification } from "../../storage/models";
export function ClassificationBadge({ value }: { value?: MoveClassification }) {
  if (!value) return null;
  return <span className={`badge ${value.replaceAll(" ", "-")}`}>{value}</span>;
}
