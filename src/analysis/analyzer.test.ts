import { Chess } from "chess.js";
import { terminalAnalysisForFen } from "./analyzer";

describe("terminal position analysis", () => {
  it("represents checkmate without asking the engine for an info line", () => {
    const chess = new Chess();
    for (const move of ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"]) chess.move(move);
    expect(terminalAnalysisForFen(chess.fen())).toMatchObject({ bestMove: "(none)", score: { type: "mate", value: -1 } });
  });

  it("represents terminal draws as zero centipawns", () => {
    expect(terminalAnalysisForFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1")).toMatchObject({ score: { type: "cp", value: 0 } });
  });
});
