import { parsePgn } from "./pgnParser";
import { reconstructGame } from "./gameReconstructor";

const scholarsMate = `[Event "Scholar's Mate"]\n[White "Ada"]\n[Black "Turing"]\n[Result "1-0"]\n\n1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6?? 4. Qxf7# 1-0`;

describe("PGN import and reconstruction", () => {
  it("preserves headers and validates moves", () => {
    const parsed = parsePgn(scholarsMate);
    expect(parsed.headers.White).toBe("Ada");
    expect(parsed.moves).toHaveLength(7);
    expect(parsed.moves.at(-1)?.san).toBe("Qxf7#");
  });

  it("reconstructs every before and after FEN with UCI", () => {
    const positions = reconstructGame(scholarsMate);
    expect(positions).toHaveLength(7);
    expect(positions[0].uci).toBe("e2e4");
    expect(positions.at(-1)?.uci).toBe("h5f7");
    expect(positions.at(-1)?.fenAfter).toContain(" b ");
  });

  it("rejects empty and oversized PGN input", () => {
    expect(() => parsePgn("  ")).toThrow("PGN is empty");
    expect(() => parsePgn("x".repeat(1_000_001))).toThrow("PGN is too large");
  });
});
