import { engineWdlLossForMover } from "./wdl";

describe("Stockfish WDL mover perspective", () => {
  it("compares the mover before the move with the inverted opponent result", () => {
    const before = { win: 500, draw: 400, loss: 100 };
    const afterFromOpponentPerspective = { win: 350, draw: 400, loss: 250 };
    expect(engineWdlLossForMover(before, afterFromOpponentPerspective)).toBeCloseTo(0.25, 5);
  });

  it("never rewards a move with negative loss", () => {
    expect(engineWdlLossForMover(
      { win: 100, draw: 500, loss: 400 },
      { win: 100, draw: 300, loss: 600 },
    )).toBe(0);
  });
});
