import { FileInput, LockKeyhole, PanelRightOpen } from "lucide-react";
import { useEffect, useState } from "react";
import type { GameContext } from "../content/fairPlayGuard";
import { gameRepository } from "../storage/repositories";
import type { StoredGame } from "../storage/models";
import { WinButton } from "../ui/components/WinButton";
import { WinTitleBar } from "../ui/components/WinTitleBar";

type PageState = { context: GameContext; pgn?: string };

function isSupportedPage(url = ""): boolean {
  return /^https:\/\/(?:www\.)?chess\.com\//.test(url) || /^https:\/\/lichess\.org\//.test(url);
}

export function PopupApp() {
  const [page, setPage] = useState<PageState>({ context: { status: "unknown" } });
  const [recent, setRecent] = useState<StoredGame[]>([]);
  const [activeTabId, setActiveTabId] = useState<number>();
  const [openError, setOpenError] = useState<string>();

  useEffect(() => {
    void gameRepository.recent(5).then(setRecent);
    if (typeof chrome === "undefined" || !chrome.tabs) return;
    void chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (!tab?.id) return;
      setActiveTabId(tab.id);
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTEXT" });
        if (response?.context) setPage(response);
      } catch {
        if (!isSupportedPage(tab.url)) return;
        try {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
          const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTEXT" });
          if (response?.context) setPage(response);
        } catch { setOpenError("Reload this chess page once, then open Litefish again."); }
      }
    });
  }, []);

  const active = page.context.status === "active";
  const available = page.context.status === "finished" || page.context.status === "analysis";

  const open = async (pgn?: string, autoStart = false) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.id) return;
    setOpenError(undefined);
    try {
      const response = await chrome.runtime.sendMessage({ type: "OPEN_REVIEW", pgn, tabId: activeTabId, autoStart });
      if (!response?.ok) setOpenError(response?.error ?? "Could not open the review panel.");
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "Could not open the review panel.");
    }
  };

  return <div className="app-shell"><WinTitleBar subtitle="" /><main className="popup stack"><section className="panel"><div className="panel-body stack"><div className={`notice ${active ? "danger" : ""}`}>{active ? <><strong>Active game detected</strong><br />Review becomes available after the game ends.</> : available ? <><strong>Review available</strong><br />A completed game or analysis board was detected.</> : <><strong>No completed game detected</strong><br />Import a PGN to start a local review.</>}</div>{openError && <div className="notice danger" role="alert">{openError}</div>}<WinButton variant="primary" icon={<PanelRightOpen size={15} />} disabled={!available} onClick={() => void open(page.pgn, Boolean(page.pgn))}>Review current game</WinButton><WinButton icon={<FileInput size={15} />} disabled={activeTabId === undefined} onClick={() => void open()}>Import PGN</WinButton><div className="row small muted"><LockKeyhole size={13} /> Engine assistance is always blocked in live games.</div></div></section><section className="panel"><h2 className="panel-heading">Recent reviews</h2><div className="panel-body">{recent.length ? recent.map((game) => <button key={game.id} className="recent-game" onClick={() => void open(game.pgn, true)}><span className="row spread"><strong>{game.white} – {game.black}</strong><span>{game.result}</span></span><span className="small muted">{game.summary.whiteAccuracy.toFixed(0)} · {game.summary.blackAccuracy.toFixed(0)} accuracy</span></button>) : <p className="small muted">Reviewed games will appear here and remain on this device.</p>}</div></section></main></div>;
}
