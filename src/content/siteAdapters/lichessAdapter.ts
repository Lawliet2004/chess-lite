import { isGameOverOrAnalysisMode } from "../fairPlayGuard";
import { fetchExportPgn, findEmbeddedPgn, movesToPgn } from "./genericPgnAdapter";
import type { SiteAdapter } from "./types";

export const lichessAdapter: SiteAdapter = {
  matches: (url) => url.hostname === "lichess.org",
  async inspect(doc, url) {
    const context = isGameOverOrAnalysisMode(doc, url);
    if (context.status !== "finished" && context.status !== "analysis") return { context, source: "lichess" };
    const embedded = findEmbeddedPgn(doc); if (embedded) return { context, pgn: embedded, source: "lichess" };
    const gameId = url.pathname.split("/").filter(Boolean)[0];
    if (context.status === "finished" && /^[a-zA-Z0-9]{8,12}$/.test(gameId ?? "")) {
      try {
        const response = await fetch(`/game/export/${gameId}`, { headers: { Accept: "application/x-chess-pgn" }, credentials: "include" });
        const pgn = await response.text();
        if (response.ok && pgn.length <= 1_000_000 && pgn.includes("1.")) return { context, pgn, source: "lichess" };
      } catch { /* Continue through local extraction layers. */ }
    }
    const exported = await fetchExportPgn(doc, "lichess.org"); if (exported) return { context, pgn: exported, source: "lichess" };
    const moves = [...doc.querySelectorAll<HTMLElement>("kwdb san, .moves san, move san")].map((node) => node.textContent?.trim() ?? "").filter(Boolean);
    return { context, pgn: movesToPgn(moves, { Result: context.status === "finished" ? context.result ?? "*" : "*" }), source: "lichess" };
  },
};
