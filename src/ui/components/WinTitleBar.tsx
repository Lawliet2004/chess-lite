export function WinTitleBar({ subtitle = "Local post-game analysis" }: { subtitle?: string }) {
  return <header className="titlebar"><span className="brand-mark" aria-hidden="true">♞</span><span className="brand-title">ChessLite</span><span className="brand-subtitle">{subtitle}</span></header>;
}
