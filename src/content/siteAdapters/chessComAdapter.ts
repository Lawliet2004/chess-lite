import { isGameOverOrAnalysisMode } from "../fairPlayGuard";
import { fetchExportPgn, findEmbeddedPgn, movesToPgn } from "./genericPgnAdapter";
import type { SiteAdapter } from "./types";

export const chessComAdapter: SiteAdapter = {
  matches: (url) => url.hostname === "www.chess.com" || url.hostname === "chess.com",
  async inspect(doc, url) {
    const context = isGameOverOrAnalysisMode(doc, url);
    if (context.status !== "finished" && context.status !== "analysis") return { context, source: "chess.com" };
    const embedded = findEmbeddedPgn(doc); if (embedded) return { context, pgn: embedded, source: "chess.com" };
    const exported = await fetchExportPgn(doc, "www.chess.com"); if (exported) return { context, pgn: exported, source: "chess.com" };
    const moves = [...doc.querySelectorAll<HTMLElement>("[data-whole-move-number] .move-san, wc-simple-move, .move-text-component")].map((node) => node.textContent?.trim() ?? "").filter(Boolean);
    return { context, pgn: movesToPgn(moves, { Result: context.status === "finished" ? context.result ?? "*" : "*" }), source: "chess.com" };
  },
};
