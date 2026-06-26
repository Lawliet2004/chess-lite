export function AccuracyMeter({ label, value }: { label: string; value: number }) {
  return <div className="metric"><div className="metric-value">{value.toFixed(1)}</div><div className="metric-label">{label} accuracy</div></div>;
}
