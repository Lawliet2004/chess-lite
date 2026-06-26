import type { AnalyzedMove } from "../../storage/models";
export function CriticalMoments({ moves, onSelect }: { moves: AnalyzedMove[]; onSelect: (ply: number) => void }) {
  const moments = [...moves].filter((move) => ["Blunder", "Mistake", "Missed Win", "Great Move", "Brilliant Candidate"].includes(move.classification ?? "")).sort((a, b) => (b.wdlLoss ?? 0) - (a.wdlLoss ?? 0)).slice(0, 5);
  if (!moments.length) return <p className="small muted">No major turning points found.</p>;
  return <div className="stack">{moments.map((move) => <button className="recent-game" key={move.ply} onClick={() => onSelect(move.ply)}><span className="row spread"><strong>{move.moveNumber}{move.side === "b" ? "..." : "."} {move.san}</strong><span className="badge">{move.classification}</span></span><span className="small muted">Best: {move.bestMoveSan ?? move.bestMoveUci}</span></button>)}</div>;
}
