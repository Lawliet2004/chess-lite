import { movesToPgn } from "./genericPgnAdapter";

describe("DOM move-list PGN fallback", () => {
  it("normalizes move numbers and combined move text", () => {
    const pgn = movesToPgn(["1. e4 e5", "2. Nf3 Nc6", "3. Bb5 a6", "1-0"], { Result: "1-0" });
    expect(pgn).toContain("1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0");
  });

  it("rejects invalid page text instead of producing a partial game", () => {
    expect(movesToPgn(["1. e4", "not-a-move"])).toBeUndefined();
  });
});
