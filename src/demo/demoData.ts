import { Chess } from "chess.js";
import type { AnalyzedMove, GameSummary, MoveClassification, NormalizedEval, Side } from "../storage/models";

export const demoHeaders = {
  Event: "ChessLite Demo",
  Site: "Local",
  Date: "2026.06.26",
  White: "Ada",
  Black: "Max",
  Result: "1-0",
  Opening: "Italian Game: Center Attack",
};

export const demoPgn = `[Event "${demoHeaders.Event}"]
[Site "${demoHeaders.Site}"]
[Date "${demoHeaders.Date}"]
[White "${demoHeaders.White}"]
[Black "${demoHeaders.Black}"]
[Result "${demoHeaders.Result}"]
[Opening "${demoHeaders.Opening}"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+ 7. Bd2 Bxd2+ 8. Nbxd2 d5 9. exd5 Nxd5 10. O-O O-O 11. Re1 Bg4 12. Qb3 Na5 13. Qa4 Nc6 14. Qb3 1-0`;

type DemoMoveSeed = {
  uci: string;
  evalAfter: number;
  cpLoss: number;
  wdlLoss: number;
  accuracy: number;
  classification: MoveClassification;
  bestMoveUci: string;
  bestMoveSan: string;
  explanation: string;
  tags?: string[];
};

const seeds: DemoMoveSeed[] = [
  { uci: "e2e4", evalAfter: 28, cpLoss: 0, wdlLoss: 0.01, accuracy: 100, classification: "Book", bestMoveUci: "e2e4", bestMoveSan: "e4", explanation: "A principled central move that opens lines for both the queen and bishop.", tags: ["Opening"] },
  { uci: "e7e5", evalAfter: 20, cpLoss: 3, wdlLoss: 0.01, accuracy: 98, classification: "Book", bestMoveUci: "e7e5", bestMoveSan: "e5", explanation: "Black mirrors the center and keeps development flexible.", tags: ["Opening"] },
  { uci: "g1f3", evalAfter: 35, cpLoss: 0, wdlLoss: 0.01, accuracy: 100, classification: "Book", bestMoveUci: "g1f3", bestMoveSan: "Nf3", explanation: "Develops with tempo on the e5 pawn and prepares castling.", tags: ["Development"] },
  { uci: "b8c6", evalAfter: 30, cpLoss: 2, wdlLoss: 0.01, accuracy: 99, classification: "Book", bestMoveUci: "b8c6", bestMoveSan: "Nc6", explanation: "A natural developing move that defends e5.", tags: ["Development"] },
  { uci: "f1c4", evalAfter: 42, cpLoss: 4, wdlLoss: 0.01, accuracy: 98, classification: "Book", bestMoveUci: "f1c4", bestMoveSan: "Bc4", explanation: "Targets f7 and enters Italian Game structures.", tags: ["Opening"] },
  { uci: "f8c5", evalAfter: 34, cpLoss: 6, wdlLoss: 0.02, accuracy: 97, classification: "Book", bestMoveUci: "f8c5", bestMoveSan: "Bc5", explanation: "Black develops actively and contests the same diagonal.", tags: ["Opening"] },
  { uci: "c2c3", evalAfter: 48, cpLoss: 5, wdlLoss: 0.02, accuracy: 97, classification: "Excellent", bestMoveUci: "c2c3", bestMoveSan: "c3", explanation: "Supports a broad center with d4.", tags: ["Plan"] },
  { uci: "g8f6", evalAfter: 44, cpLoss: 4, wdlLoss: 0.01, accuracy: 98, classification: "Best", bestMoveUci: "g8f6", bestMoveSan: "Nf6", explanation: "Develops and pressures e4 before White expands.", tags: ["Development"] },
  { uci: "d2d4", evalAfter: 70, cpLoss: 0, wdlLoss: 0.01, accuracy: 100, classification: "Best", bestMoveUci: "d2d4", bestMoveSan: "d4", explanation: "White strikes in the center while development is ahead.", tags: ["Center"] },
  { uci: "e5d4", evalAfter: 58, cpLoss: 8, wdlLoss: 0.02, accuracy: 96, classification: "Good", bestMoveUci: "e5d4", bestMoveSan: "exd4", explanation: "Black accepts the central tension and keeps material balanced." },
  { uci: "c3d4", evalAfter: 76, cpLoss: 2, wdlLoss: 0.01, accuracy: 99, classification: "Best", bestMoveUci: "c3d4", bestMoveSan: "cxd4", explanation: "White recaptures toward the center and opens the c-file.", tags: ["Center"] },
  { uci: "c5b4", evalAfter: 62, cpLoss: 12, wdlLoss: 0.03, accuracy: 94, classification: "Good", bestMoveUci: "c5b4", bestMoveSan: "Bb4+", explanation: "The check gains a tempo, though it lets White simplify comfortably." },
  { uci: "c1d2", evalAfter: 82, cpLoss: 0, wdlLoss: 0.01, accuracy: 100, classification: "Best", bestMoveUci: "c1d2", bestMoveSan: "Bd2", explanation: "Develops while answering the check.", tags: ["Development"] },
  { uci: "b4d2", evalAfter: 90, cpLoss: 25, wdlLoss: 0.04, accuracy: 88, classification: "Inaccuracy", bestMoveUci: "b4e7", bestMoveSan: "Be7", explanation: "Trading this bishop reduces Black's pressure and leaves White with easier development.", tags: ["Trade"] },
  { uci: "b1d2", evalAfter: 112, cpLoss: 0, wdlLoss: 0.01, accuracy: 100, classification: "Best", bestMoveUci: "b1d2", bestMoveSan: "Nxd2", explanation: "White recaptures with a piece and keeps the center stable.", tags: ["Recapture"] },
  { uci: "d7d5", evalAfter: 74, cpLoss: 18, wdlLoss: 0.04, accuracy: 90, classification: "Good", bestMoveUci: "d7d6", bestMoveSan: "d6", explanation: "A direct central break, but it gives White a clear target." },
  { uci: "e4d5", evalAfter: 126, cpLoss: 4, wdlLoss: 0.01, accuracy: 98, classification: "Excellent", bestMoveUci: "e4d5", bestMoveSan: "exd5", explanation: "White accepts the challenge and wins central space.", tags: ["Center"] },
  { uci: "f6d5", evalAfter: 118, cpLoss: 10, wdlLoss: 0.02, accuracy: 95, classification: "Good", bestMoveUci: "f6d5", bestMoveSan: "Nxd5", explanation: "Black restores material balance but the piece can become a tactical target." },
  { uci: "e1g1", evalAfter: 134, cpLoss: 0, wdlLoss: 0.01, accuracy: 100, classification: "Best", bestMoveUci: "e1g1", bestMoveSan: "O-O", explanation: "White secures the king before opening more lines.", tags: ["King safety"] },
  { uci: "e8g8", evalAfter: 128, cpLoss: 7, wdlLoss: 0.02, accuracy: 96, classification: "Excellent", bestMoveUci: "e8g8", bestMoveSan: "O-O", explanation: "Black also completes king safety." },
  { uci: "f1e1", evalAfter: 160, cpLoss: 1, wdlLoss: 0.01, accuracy: 99, classification: "Best", bestMoveUci: "f1e1", bestMoveSan: "Re1", explanation: "The rook claims the open file and supports tactics on e-file pins.", tags: ["Open file"] },
  { uci: "c8g4", evalAfter: 210, cpLoss: 42, wdlLoss: 0.08, accuracy: 76, classification: "Mistake", bestMoveUci: "c8e6", bestMoveSan: "Be6", explanation: "The pin looks active, but it leaves the queenside knight tactically vulnerable.", tags: ["Tactical target"] },
  { uci: "d1b3", evalAfter: 280, cpLoss: 0, wdlLoss: 0.01, accuracy: 100, classification: "Great Move", bestMoveUci: "d1b3", bestMoveSan: "Qb3", explanation: "White attacks b7 and d5 at once, forcing Black to solve two problems.", tags: ["Double attack"] },
  { uci: "c6a5", evalAfter: 410, cpLoss: 85, wdlLoss: 0.15, accuracy: 52, classification: "Blunder", bestMoveUci: "c6e7", bestMoveSan: "Ne7", explanation: "The knight move misses the pressure on d5 and lets White keep a lasting initiative.", tags: ["Loose piece"] },
  { uci: "b3a4", evalAfter: 430, cpLoss: 5, wdlLoss: 0.01, accuracy: 98, classification: "Excellent", bestMoveUci: "b3a4", bestMoveSan: "Qa4", explanation: "White keeps the queen active and maintains pressure on the pinned structure." },
  { uci: "a5c6", evalAfter: 360, cpLoss: 20, wdlLoss: 0.05, accuracy: 86, classification: "Inaccuracy", bestMoveUci: "a5c4", bestMoveSan: "Nc4", explanation: "Retreating concedes time without fully solving the coordination issues." },
  { uci: "a4b3", evalAfter: 390, cpLoss: 3, wdlLoss: 0.01, accuracy: 99, classification: "Best", bestMoveUci: "a4b3", bestMoveSan: "Qb3", explanation: "White repeats the pressure point and keeps the advantage without risk.", tags: ["Conversion"] },
];

const evalBefore = (index: number): NormalizedEval => ({ type: "cp", value: index === 0 ? 20 : seeds[index - 1].evalAfter });

export const demoMoves: AnalyzedMove[] = (() => {
  const chess = new Chess();
  return seeds.map((seed, index) => {
    const fenBefore = chess.fen();
    const move = chess.move({ from: seed.uci.slice(0, 2), to: seed.uci.slice(2, 4), promotion: seed.uci[4] });
    if (!move) throw new Error(`Invalid demo move: ${seed.uci}`);
    const side = move.color as Side;
    return {
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      side,
      san: move.san,
      uci: seed.uci,
      fenBefore,
      fenAfter: chess.fen(),
      bestMoveUci: seed.bestMoveUci,
      bestMoveSan: seed.bestMoveSan,
      evalBefore: evalBefore(index),
      evalAfter: { type: "cp", value: seed.evalAfter },
      cpLoss: seed.cpLoss,
      wdlLoss: seed.wdlLoss,
      accuracy: seed.accuracy,
      classification: seed.classification,
      pv: [seed.bestMoveUci, "d2d4", "g8f6"].filter((pvMove, pvIndex) => pvIndex === 0 || pvMove !== seed.uci),
      explanation: seed.explanation,
      tags: seed.tags,
    };
  });
})();

export const demoSummary: GameSummary = {
  whiteAccuracy: 98.1,
  blackAccuracy: 84.2,
  quality: 91.2,
  whiteAverageCpLoss: 2,
  blackAverageCpLoss: 26,
  opening: demoHeaders.Opening,
  decisivePly: 24,
  counts: {
    w: { Book: 3, Best: 6, Excellent: 3, "Great Move": 1 },
    b: { Book: 3, Excellent: 1, Good: 5, Inaccuracy: 2, Mistake: 1, Blunder: 1 },
  },
  whitePerformance: { rating: 2220, low: 2040, high: 2380, confidence: "medium", sampleMoves: 10 },
  blackPerformance: { rating: 1560, low: 1320, high: 1760, confidence: "low", sampleMoves: 10 },
};
