export function WinProgress({ value, label }: { value: number; label: string }) {
  return <div className="stack" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}><div className="row spread small"><span>{label}</span><span>{Math.round(value)}%</span></div><div className="progress-track"><div className="progress-bar" style={{ width: `${value}%` }} /></div></div>;
}
