import type { AnalyzedMove, MoveClassification } from "../../storage/models";
import { MoveTypeWidget } from "./MoveTypeWidget";
import { getTimelineMoveType } from "./moveTypes";

function formatAccuracy(value: number | undefined): string {
  return value === undefined ? "N/A" : `${value.toFixed(0)}%`;
}

function formatMoveType(classification: MoveClassification | undefined): string {
  return classification ? getTimelineMoveType(classification) : "Unclassified";
}

export function MoveList({ moves, selectedPly, onSelect }: { moves: AnalyzedMove[]; selectedPly: number; onSelect: (ply: number) => void }) {
  const rows = Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => [moves[index * 2], moves[index * 2 + 1]]);
  return <div className="move-list" role="list" aria-label="Analyzed moves">{rows.map(([white, black], index) => <div className="move-row" role="listitem" key={index}><span className="move-number">{index + 1}.</span>{[white, black].map((move, sideIndex) => move ? <button key={move.ply} className={`move-cell ${selectedPly === move.ply ? "selected" : ""}`} onClick={() => onSelect(move.ply)} aria-current={selectedPly === move.ply ? "step" : undefined}><span className="move-main"><span className="move-san">{move.san}</span><MoveTypeWidget classification={move.classification} /></span><span className="move-class">{formatMoveType(move.classification)} - {formatAccuracy(move.accuracy)}</span></button> : <span key={sideIndex} />)}</div>)}</div>;
}
