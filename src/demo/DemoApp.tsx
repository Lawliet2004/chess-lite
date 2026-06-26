import { useState } from "react";
import { Download, FlipHorizontal2, RotateCcw } from "lucide-react";
import { exportAnalysisJson, exportAnnotatedPgn } from "../analysis/reportBuilder";
import { ChessBoard } from "../ui/components/ChessBoard";
import { CriticalMoments } from "../ui/components/CriticalMoments";
import { EvalGraph } from "../ui/components/EvalGraph";
import { GameSummary } from "../ui/components/GameSummary";
import { MoveDetails } from "../ui/components/MoveDetails";
import { MoveList } from "../ui/components/MoveList";
import { WinButton } from "../ui/components/WinButton";
import { WinCard } from "../ui/components/WinCard";
import { WinTitleBar } from "../ui/components/WinTitleBar";
import { demoHeaders, demoMoves, demoPgn, demoSummary } from "./demoData";

function download(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function DemoApp() {
  const [selectedPly, setSelectedPly] = useState(15);
  const [flipped, setFlipped] = useState(false);
  const selected = demoMoves.find((move) => move.ply === selectedPly) ?? demoMoves.at(-1);
  const issues = demoMoves.filter((move) => ["Inaccuracy", "Mistake", "Blunder", "Missed Win"].includes(move.classification ?? ""));
  const jumpIssue = (direction: number) => {
    const index = issues.findIndex((move) => move.ply >= selectedPly);
    const next = (Math.max(0, index) + direction + issues.length) % issues.length;
    setSelectedPly(issues[next].ply);
  };

  return (
    <div className="app-shell demo-shell">
      <WinTitleBar subtitle="Interactive public demo" />
      <section className="demo-banner">
        <div>
          <p className="demo-eyebrow">Local-first chess review</p>
          <h1>Explore a finished-game analysis without installing the extension.</h1>
        </div>
        <div className="demo-actions">
          <WinButton
            icon={<Download size={14} />}
            onClick={() => download("chesslite-demo.pgn", exportAnnotatedPgn(demoPgn, demoMoves), "application/x-chess-pgn")}
          >
            PGN
          </WinButton>
          <WinButton
            icon={<Download size={14} />}
            onClick={() => download("chesslite-demo.json", exportAnalysisJson({ headers: demoHeaders, summary: demoSummary, moves: demoMoves }), "application/json")}
          >
            JSON
          </WinButton>
        </div>
      </section>
      <main className="review-layout">
        <WinCard className="board-panel">
          <ChessBoard
            fen={selected?.fenAfter ?? demoMoves[0].fenBefore}
            playedMove={selected?.uci}
            moveClassification={selected?.classification}
            bestMove={selected?.bestMoveUci}
            flipped={flipped}
          />
          <div className="row spread board-controls">
            <div className="row">
              <WinButton className="icon-button" aria-label="First move" onClick={() => setSelectedPly(1)}>
                |&lt;
              </WinButton>
              <WinButton className="icon-button" aria-label="Previous move" onClick={() => setSelectedPly(Math.max(1, selectedPly - 1))}>
                &lt;
              </WinButton>
              <WinButton className="icon-button" aria-label="Next move" onClick={() => setSelectedPly(Math.min(demoMoves.length, selectedPly + 1))}>
                &gt;
              </WinButton>
              <WinButton className="icon-button" aria-label="Last move" onClick={() => setSelectedPly(demoMoves.length)}>
                &gt;|
              </WinButton>
            </div>
            <WinButton className="icon-button" aria-label="Flip board" icon={<FlipHorizontal2 size={15} />} onClick={() => setFlipped(!flipped)} />
          </div>
        </WinCard>
        <section className="panel moves-panel">
          <h2 className="panel-heading">Move timeline</h2>
          <MoveList moves={demoMoves} selectedPly={selectedPly} onSelect={setSelectedPly} />
        </section>
        <aside className="panel details-panel">
          <div className="panel-heading row spread">
            <span>Review details</span>
            <WinButton className="icon-button" aria-label="Reset demo" icon={<RotateCcw size={14} />} onClick={() => setSelectedPly(15)} />
          </div>
          <div className="panel-body stack">
            <GameSummary summary={demoSummary} white={demoHeaders.White} black={demoHeaders.Black} result={demoHeaders.Result} />
            <div className="divider" />
            <MoveDetails move={selected} onPreviousIssue={() => jumpIssue(-1)} onNextIssue={() => jumpIssue(1)} />
            <div className="divider" />
            <h3 className="section-subtitle">Critical moments</h3>
            <CriticalMoments moves={demoMoves} onSelect={setSelectedPly} />
          </div>
        </aside>
        <WinCard title="Evaluation" className="graph-panel">
          <EvalGraph moves={demoMoves} selectedPly={selectedPly} onSelect={setSelectedPly} />
        </WinCard>
      </main>
    </div>
  );
}
