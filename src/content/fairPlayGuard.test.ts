import { canEnableEngineReview, isGameOverOrAnalysisMode } from "./fairPlayGuard";

describe("fair-play guard", () => {
  it("blocks active and unknown game contexts", () => {
    expect(canEnableEngineReview({ status: "active", reason: "Clock is running" })).toBe(false);
    expect(canEnableEngineReview({ status: "unknown" })).toBe(false);
  });

  it("allows only finished games and analysis boards", () => {
    expect(canEnableEngineReview({ status: "finished", result: "1-0" })).toBe(true);
    expect(canEnableEngineReview({ status: "analysis", reason: "Analysis board" })).toBe(true);
  });

  it("uses fail-closed document signals", () => {
    document.body.innerHTML = '<div data-game-status="playing"><span class="clock-running"></span></div>';
    expect(isGameOverOrAnalysisMode(document, new URL("https://lichess.org/abcd"))).toEqual({
      status: "active",
      reason: "Live-game indicators are present",
    });
  });

  it("treats a Lichess replay with a result as finished, not generic analysis", () => {
    document.body.innerHTML = '<main class="analyse"><div class="analyse__moves"><div class="result">½-½</div></div></main>';
    expect(isGameOverOrAnalysisMode(document, new URL("https://lichess.org/q7ZvsdUF"))).toEqual({
      status: "finished",
      result: "½-½",
    });
  });
});
