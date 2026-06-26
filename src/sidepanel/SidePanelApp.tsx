import { Chess } from "chess.js";
import { Download, FlipHorizontal2, Pause, Play, RotateCcw, Settings2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameAnalyzer } from "../analysis/analyzer";
import { buildSummary, exportAnalysisJson, exportAnnotatedPgn } from "../analysis/reportBuilder";
import type { PendingReview } from "../background/openReviewFlow";
import { parsePgn } from "../chess/pgnParser";
import { canEnableEngineReview } from "../content/fairPlayGuard";
import { StockfishWorkerClient } from "../engine/StockfishWorkerClient";
import type { StoredGame } from "../storage/models";
import { gameRepository } from "../storage/repositories";
import { ChessBoard } from "../ui/components/ChessBoard";
import { CriticalMoments } from "../ui/components/CriticalMoments";
import { EvalGraph } from "../ui/components/EvalGraph";
import { GameSummary } from "../ui/components/GameSummary";
import { MoveDetails } from "../ui/components/MoveDetails";
import { MoveList } from "../ui/components/MoveList";
import { SettingsPanel } from "../ui/components/SettingsPanel";
import { WinButton } from "../ui/components/WinButton";
import { WinCard } from "../ui/components/WinCard";
import { WinProgress } from "../ui/components/WinProgress";
import { WinTitleBar } from "../ui/components/WinTitleBar";
import { useReviewStore } from "./reviewStore";

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function SidePanelApp() {
  const state = useReviewStore();
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const abortRef = useRef<AbortController>();
  const engineRef = useRef<StockfishWorkerClient>();
  const lastPendingRequest = useRef<string>();
  const runReviewRef = useRef(runReview);
  runReviewRef.current = runReview;

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.session) {
      return () => {
        void engineRef.current?.quit();
      };
    }

    let active = true;
    const applyPending = (value: unknown) => {
      if (!active || !value || typeof value !== "object") return;
      const pending = value as Partial<PendingReview>;
      const requestId = pending.requestId ?? String(pending.createdAt ?? "");
      if (!requestId || requestId === lastPendingRequest.current) return;
      lastPendingRequest.current = requestId;
      const pgn = typeof pending.pgn === "string" ? pending.pgn : "";
      useReviewStore.getState().reset();
      setInput(pgn);
      if (pending.autoStart && pgn) window.setTimeout(() => void runReviewRef.current(pgn), 0);
    };

    void chrome.storage.session.get("pendingReview").then(({ pendingReview }) => applyPending(pendingReview));
    const onStorageChange = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName === "session" && changes.pendingReview) applyPending(changes.pendingReview.newValue);
    };
    chrome.storage.onChanged.addListener(onStorageChange);
    return () => {
      active = false;
      chrome.storage.onChanged.removeListener(onStorageChange);
      void engineRef.current?.quit();
    };
  }, []);

  const selected = state.moves.find((move) => move.ply === state.selectedPly) ?? state.moves.at(-1);
  const fen = selected?.fenAfter ?? new Chess().fen();
  const headers = useMemo(() => {
    try {
      return state.pgn ? parsePgn(state.pgn).headers : {};
    } catch {
      return {};
    }
  }, [state.pgn]);
  const issues = state.moves.filter((move) => ["Inaccuracy", "Mistake", "Blunder", "Missed Win"].includes(move.classification ?? ""));
  const jumpIssue = (direction: number) => {
    if (!issues.length) return;
    const index = issues.findIndex((move) => move.ply >= state.selectedPly);
    const next = (Math.max(0, index) + direction + issues.length) % issues.length;
    state.set({ selectedPly: issues[next].ply });
  };

  async function runReview(pgnOverride?: string) {
    if (!canEnableEngineReview({ status: "analysis", reason: "User-imported PGN" })) return;
    try {
      const parsed = parsePgn(pgnOverride ?? input);
      const controller = new AbortController();
      abortRef.current = controller;
      state.set({ pgn: parsed.pgn, analyzing: true, progress: 0, moves: [], summary: undefined, error: undefined });
      const engine = engineRef.current ?? new StockfishWorkerClient();
      engineRef.current = engine;
      const analyzer = new GameAnalyzer(engine);
      const moves = await analyzer.analyzePgn(parsed.pgn, state.settings, {
        signal: controller.signal,
        onProgress: ({ completed, total, moves: partial }) =>
          state.set({ moves: partial, selectedPly: partial.at(-1)?.ply ?? 0, progress: (completed / total) * 100 }),
      });
      const opening = parsed.headers.Opening ?? (parsed.headers.ECO ? `ECO ${parsed.headers.ECO}` : "Opening not detected");
      const summary = buildSummary(moves, opening);
      state.set({ moves, summary, selectedPly: 1, progress: 100, analyzing: false });

      if (state.settings.saveReviews) {
        const now = Date.now();
        const game: StoredGame = {
          id: crypto.randomUUID(),
          source: "manual",
          pgn: parsed.pgn,
          white: parsed.headers.White ?? "White",
          black: parsed.headers.Black ?? "Black",
          result: parsed.headers.Result ?? "*",
          date: parsed.headers.Date,
          timeControl: parsed.headers.TimeControl,
          createdAt: now,
          updatedAt: now,
          reviewSettings: state.settings,
          summary,
          moves,
        };
        await gameRepository.save(game);
      }
    } catch (error) {
      state.set({
        analyzing: false,
        error:
          error instanceof DOMException && error.name === "AbortError"
            ? "Analysis stopped. Partial results are available."
            : error instanceof Error
              ? error.message
              : "Review failed",
      });
    }
  }

  if (!state.pgn && !state.analyzing) {
    return (
      <div className="app-shell">
        <WinTitleBar />
        <main className="empty-state">
          <WinCard className="import-card">
            <div className="stack">
              <div className="import-hero">
                <div className="hero-icon">♞</div>
                <div>
                  <h1>Review a finished game</h1>
                  <p>Paste a PGN. Analysis stays on this device.</p>
                </div>
              </div>
              <div className="notice danger">Review is disabled during active games. ChessLite never suggests or plays live moves.</div>
              <label>
                <span className="label">Portable Game Notation</span>
                <textarea
                  className="field"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={'[Event "Casual Game"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 ...'}
                />
              </label>
              <SettingsPanel settings={state.settings} onChange={(settings) => state.set({ settings })} />
              {state.error && (
                <div className="notice danger" role="alert">
                  {state.error}
                </div>
              )}
              <WinButton variant="primary" icon={<Play size={15} />} disabled={!input.trim()} onClick={() => void runReview()}>
                Start local review
              </WinButton>
            </div>
          </WinCard>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <WinTitleBar subtitle={state.analyzing ? "Stockfish is analyzing locally" : "Review complete"} />
      {state.analyzing && (
        <div style={{ padding: "10px 14px" }}>
          <WinProgress value={state.progress} label={`Analyzing move ${state.moves.length + 1}`} />
          <WinButton variant="danger" icon={<Pause size={14} />} onClick={() => abortRef.current?.abort()}>
            Stop
          </WinButton>
        </div>
      )}
      {state.error && (
        <div className="notice danger" role="alert">
          {state.error}
        </div>
      )}
      <main className="review-layout">
        <WinCard className="board-panel">
          <ChessBoard
            fen={fen}
            playedMove={selected?.uci}
            moveClassification={selected?.classification}
            bestMove={selected?.bestMoveUci}
            flipped={flipped}
          />
          <div className="row spread" style={{ marginTop: 10 }}>
            <div className="row">
              <WinButton className="icon-button" aria-label="First move" onClick={() => state.set({ selectedPly: 1 })}>
                |‹
              </WinButton>
              <WinButton className="icon-button" aria-label="Previous move" onClick={() => state.set({ selectedPly: Math.max(1, state.selectedPly - 1) })}>
                ‹
              </WinButton>
              <WinButton className="icon-button" aria-label="Next move" onClick={() => state.set({ selectedPly: Math.min(state.moves.length, state.selectedPly + 1) })}>
                ›
              </WinButton>
              <WinButton className="icon-button" aria-label="Last move" onClick={() => state.set({ selectedPly: state.moves.length })}>
                ›|
              </WinButton>
            </div>
            <WinButton className="icon-button" aria-label="Flip board" icon={<FlipHorizontal2 size={15} />} onClick={() => setFlipped(!flipped)} />
          </div>
        </WinCard>
        <section className="panel moves-panel">
          <h2 className="panel-heading">Move timeline</h2>
          <MoveList moves={state.moves} selectedPly={state.selectedPly} onSelect={(selectedPly) => state.set({ selectedPly })} />
        </section>
        <aside className="panel details-panel">
          <div className="panel-heading row spread">
            <span>Review details</span>
            <WinButton className="icon-button" aria-label="Review settings" icon={<Settings2 size={14} />} onClick={() => setSettingsOpen(!settingsOpen)} />
          </div>
          <div className="panel-body stack">
            {settingsOpen && <SettingsPanel settings={state.settings} onChange={(settings) => state.set({ settings })} />}
            {state.summary && <GameSummary summary={state.summary} white={headers.White ?? "White"} black={headers.Black ?? "Black"} result={headers.Result ?? "*"} />}
            <div className="divider" />
            <MoveDetails move={selected} onPreviousIssue={() => jumpIssue(-1)} onNextIssue={() => jumpIssue(1)} />
            <div className="divider" />
            <h3 style={{ margin: 0, fontSize: 14 }}>Critical moments</h3>
            <CriticalMoments moves={state.moves} onSelect={(selectedPly) => state.set({ selectedPly })} />
            <div className="row">
              <WinButton icon={<Download size={14} />} onClick={() => download("chesslite-review.pgn", exportAnnotatedPgn(state.pgn, state.moves), "application/x-chess-pgn")}>
                PGN
              </WinButton>
              <WinButton icon={<Download size={14} />} onClick={() => download("chesslite-review.json", exportAnalysisJson({ headers, summary: state.summary, moves: state.moves }), "application/json")}>
                JSON
              </WinButton>
              <WinButton icon={<RotateCcw size={14} />} onClick={() => state.reset()}>
                New
              </WinButton>
            </div>
          </div>
        </aside>
        <WinCard title="Evaluation" className="graph-panel">
          <EvalGraph moves={state.moves} selectedPly={state.selectedPly} onSelect={(selectedPly) => state.set({ selectedPly })} />
        </WinCard>
      </main>
    </div>
  );
}
