import type { ReactNode } from "react";
export function WinCard({ title, className = "", children }: { title?: string; className?: string; children: ReactNode }) {
  return <section className={`panel ${className}`}>{title && <h2 className="panel-heading">{title}</h2>}<div className="panel-body">{children}</div></section>;
}
