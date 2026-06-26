import { createAccumulator, parseBestMove, parseInfoLine } from "./evalParser";

describe("UCI output parsing", () => {
  it("parses cp and mate info without conflating score types", () => {
    expect(parseInfoLine("info depth 14 seldepth 21 multipv 1 score cp 37 wdl 321 456 223 nodes 900 nps 45000 time 20 pv e2e4 e7e5")).toMatchObject({
      depth: 14,
      score: { type: "cp", value: 37 },
      wdl: { win: 321, draw: 456, loss: 223 },
      pv: ["e2e4", "e7e5"],
    });
    expect(parseInfoLine("info depth 18 score mate -3 pv h7h8q")).toMatchObject({ score: { type: "mate", value: -3 } });
  });

  it("parses bestmove and optional ponder", () => {
    expect(parseBestMove("bestmove e2e4 ponder e7e5")).toEqual({ bestMove: "e2e4", ponder: "e7e5" });
  });

  it("retains the deepest line for each multipv index", () => {
    const acc = createAccumulator();
    acc.push(parseInfoLine("info depth 8 multipv 1 score cp 10 pv e2e4")!);
    acc.push(parseInfoLine("info depth 12 multipv 1 score cp 20 pv d2d4")!);
    expect(acc.lines()[0]).toMatchObject({ depth: 12, pv: ["d2d4"] });
  });
});
