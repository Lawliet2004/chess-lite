import { isCommonOpeningSequence } from "./openingDetector";

describe("fallback opening detection", () => {
  it("recognizes only bundled common line prefixes", () => {
    expect(isCommonOpeningSequence(["e2e4", "e7e5", "f1c4", "b8c6"])).toBe(true);
    expect(isCommonOpeningSequence(["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6", "h5f7"])).toBe(false);
  });
});
