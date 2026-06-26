import { classifyMove } from "./moveClassifier";

describe("move classification", () => {
  it("prioritizes book, forced, and mate-specific outcomes", () => {
    expect(classifyMove({ cpLoss: 500, wdlLoss: 0.5, isBook: true })).toBe("Book");
    expect(classifyMove({ cpLoss: 500, wdlLoss: 0.5, isForced: true })).toBe("Forced");
    expect(classifyMove({ cpLoss: 0, wdlLoss: 0, missedForcedMate: true })).toBe("Missed Win");
  });

  it("classifies by the worse of cp and WDL loss", () => {
    expect(classifyMove({ cpLoss: 5, wdlLoss: 0.2 })).toBe("Mistake");
    expect(classifyMove({ cpLoss: 320, wdlLoss: 0.01 })).toBe("Blunder");
    expect(classifyMove({ cpLoss: 60, wdlLoss: 0.06 })).toBe("Good");
  });

  it("does not call a sacrifice brilliant without strict evidence", () => {
    expect(classifyMove({ cpLoss: 5, wdlLoss: 0, sacrifice: true })).toBe("Best");
    expect(classifyMove({ cpLoss: 3, wdlLoss: 0, sacrifice: true, isOnlyMove: true, bestMove: true })).toBe("Brilliant Candidate");
  });
});
