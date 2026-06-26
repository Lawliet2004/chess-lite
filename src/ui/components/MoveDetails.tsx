import { Copy, SkipBack, SkipForward } from "lucide-react";
import { formatEval } from "../../analysis/evalNormalization";
import type { AnalyzedMove } from "../../storage/models";
import { ClassificationBadge } from "./ClassificationBadge";
import { EngineLine } from "./EngineLine";
import { WinButton } from "./WinButton";

export function MoveDetails({ move, onPreviousIssue, onNextIssue }: { move?: AnalyzedMove; onPreviousIssue: () => void; onNextIssue: () => void }) {
  if (!move) return <p className="muted small">Select a move to inspect its review.</p>;
  const label = `${move.moveNumber}${move.side === "b" ? "..." : "."} ${move.san}`;
  const copy = () => navigator.clipboard.writeText(`${label} — ${move.classification}. ${move.explanation}`).catch(() => undefined);
  const lossLabel = move.evalBefore?.type === "mate" || move.evalAfter?.type === "mate" ? "Mate sequence changed" : `${move.cpLoss?.toFixed(0)} cp`;
  return <div className="stack"><div className="row spread"><h2 style={{ margin: 0, fontSize: 18 }}>{label}</h2><ClassificationBadge value={move.classification} /></div><div className="metric-grid"><div className="metric"><div className="metric-value">{formatEval(move.evalBefore)}</div><div className="metric-label">Before</div></div><div className="metric"><div className="metric-value">{formatEval(move.evalAfter)}</div><div className="metric-label">After</div></div></div><div className="small"><strong>Loss</strong> {lossLabel} · {((move.wdlLoss ?? 0) * 100).toFixed(1)}% expected score</div><div className="notice">{move.explanation}</div><div><span className="label">Best move</span><strong>{move.bestMoveSan ?? move.bestMoveUci ?? "—"}</strong></div><div><span className="label">Principal variation</span><EngineLine moves={move.pv} /></div>{Boolean(move.tags?.length) && <div className="row" style={{ flexWrap: "wrap" }}>{move.tags?.map((tag) => <span className="badge" key={tag}>{tag}</span>)}</div>}<div className="row"><WinButton icon={<SkipBack size={14} />} onClick={onPreviousIssue}>Previous issue</WinButton><WinButton icon={<SkipForward size={14} />} onClick={onNextIssue}>Next issue</WinButton><WinButton className="icon-button" aria-label="Copy move note" icon={<Copy size={14} />} onClick={copy} /></div></div>;
}
