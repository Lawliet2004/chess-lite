import type { GameSummary as Summary, PerformanceEstimate } from "../../storage/models";
import { AccuracyMeter } from "./AccuracyMeter";

function PerformanceMetric({ label, estimate }: { label: string; estimate: PerformanceEstimate }) {
  return <div className="metric" title="Single-game performance estimate; this is not an account Elo rating."><div className="metric-value">≈{estimate.rating}</div><div className="metric-label">{label} game performance</div><div className="small muted">{estimate.low}–{estimate.high} · {estimate.confidence} confidence</div></div>;
}

export function GameSummary({ summary, white, black, result }: { summary: Summary; white: string; black: string; result: string }) {
  return <div className="stack"><div className="row spread"><strong>{white}</strong><span className="badge">{result}</span><strong>{black}</strong></div><div className="metric-grid"><AccuracyMeter label="White" value={summary.whiteAccuracy} /><AccuracyMeter label="Black" value={summary.blackAccuracy} /></div><div className="metric-grid"><PerformanceMetric label="White" estimate={summary.whitePerformance} /><PerformanceMetric label="Black" estimate={summary.blackPerformance} /></div><div className="notice small">Performance is an approximate range from this game’s move quality, not the player’s actual Elo.</div><div className="small muted">{summary.opening}</div><div className="small">Average loss: White {summary.whiteAverageCpLoss.toFixed(0)} cp · Black {summary.blackAverageCpLoss.toFixed(0)} cp</div></div>;
}
