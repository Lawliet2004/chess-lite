import type { ReviewSettings } from "../../storage/models";

const presets: Record<ReviewSettings["mode"], Partial<ReviewSettings>> = {
  fast: { depth: 9, movetimeMs: undefined },
  balanced: { depth: 13, movetimeMs: undefined },
  deep: { depth: 17, movetimeMs: undefined },
  custom: {},
};

export function SettingsPanel({ settings, onChange }: { settings: ReviewSettings; onChange: (settings: ReviewSettings) => void }) {
  const setMode = (mode: ReviewSettings["mode"]) => onChange({ ...settings, mode, ...presets[mode] });
  return <div className="stack"><label><span className="label">Review mode</span><select className="field" value={settings.mode} onChange={(event) => setMode(event.target.value as ReviewSettings["mode"])}><option value="fast">Fast · depth 9</option><option value="balanced">Balanced · depth 13</option><option value="deep">Deep · depth 17</option><option value="custom">Custom</option></select></label>{settings.mode === "custom" && <div className="metric-grid"><label><span className="label">Depth</span><input className="field" type="number" min="4" max="30" value={settings.depth ?? 13} onChange={(event) => onChange({ ...settings, depth: Number(event.target.value), movetimeMs: undefined })} /></label><label><span className="label">MultiPV</span><input className="field" type="number" min="1" max="5" value={settings.multipv} onChange={(event) => onChange({ ...settings, multipv: Number(event.target.value) })} /></label></div>}<label className="row small"><input type="checkbox" checked={settings.useWdl} onChange={(event) => onChange({ ...settings, useWdl: event.target.checked })} /> Use Stockfish WDL for move severity</label><label className="row small"><input type="checkbox" checked={settings.saveReviews} onChange={(event) => onChange({ ...settings, saveReviews: event.target.checked })} /> Save review locally</label><div className="notice small">Fair-play guard is enabled and cannot be disabled. Engine review never runs on an active game page.</div></div>;
}
