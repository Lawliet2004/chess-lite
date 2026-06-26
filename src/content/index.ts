import { isGameOverOrAnalysisMode } from "./fairPlayGuard";
import { mountReviewButton } from "./overlays/reviewButton";
import { chessComAdapter } from "./siteAdapters/chessComAdapter";
import { lichessAdapter } from "./siteAdapters/lichessAdapter";
import type { ExtractedGame } from "./siteAdapters/types";
import { isExtensionMessage } from "../utils/messaging";

const adapters = [chessComAdapter, lichessAdapter];
let snapshot: ExtractedGame = { context: { status: "unknown" }, source: location.hostname.includes("lichess") ? "lichess" : "chess.com" };

async function inspect(): Promise<void> {
  const url = new URL(location.href); const adapter = adapters.find((candidate) => candidate.matches(url));
  snapshot = adapter ? await adapter.inspect(document, url) : { context: isGameOverOrAnalysisMode(document, url), source: "chess.com" };
  mountReviewButton(snapshot.context, () => { void chrome.runtime.sendMessage({ type: "OPEN_REVIEW", pgn: snapshot.pgn, autoStart: Boolean(snapshot.pgn) }); });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) return false;
  if (message.type === "GET_PAGE_CONTEXT") { sendResponse({ type: "PAGE_CONTEXT", context: snapshot.context, pgn: snapshot.pgn }); return true; }
  return false;
});

void inspect();
let inspectionTimer = 0;
new MutationObserver(() => { window.clearTimeout(inspectionTimer); inspectionTimer = window.setTimeout(() => void inspect(), 900); }).observe(document.body, { childList: true, subtree: true });
