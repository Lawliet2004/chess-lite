import { fireEvent, render, screen } from "@testing-library/react";
import type { AnalyzedMove, MoveClassification } from "../../storage/models";
import { MoveList } from "./MoveList";

function move(overrides: Partial<AnalyzedMove>): AnalyzedMove {
  return {
    ply: 1,
    moveNumber: 1,
    side: "w",
    san: "e4",
    uci: "e2e4",
    fenBefore: "before",
    fenAfter: "after",
    ...overrides,
  };
}

describe("MoveList", () => {
  it("shows every supported move type as a compact timeline widget", () => {
    const classifications: Array<{ classification: MoveClassification; displayedType: string; glyph?: string }> = [
      { classification: "Brilliant Candidate", displayedType: "Brilliant", glyph: "!!" },
      { classification: "Great Move", displayedType: "Great", glyph: "!" },
      { classification: "Book", displayedType: "Book" },
      { classification: "Forced", displayedType: "Forced", glyph: "F" },
      { classification: "Best", displayedType: "Best" },
      { classification: "Excellent", displayedType: "Excellent" },
      { classification: "Good", displayedType: "Good" },
      { classification: "Inaccuracy", displayedType: "Inaccuracy", glyph: "?!" },
      { classification: "Mistake", displayedType: "Mistake", glyph: "?" },
      { classification: "Missed Win", displayedType: "Miss" },
      { classification: "Blunder", displayedType: "Blunder", glyph: "??" },
    ];

    render(
      <MoveList
        moves={classifications.map(({ classification }, index) =>
          move({
            ply: index + 1,
            moveNumber: Math.floor(index / 2) + 1,
            side: index % 2 === 0 ? "w" : "b",
            san: `M${index + 1}`,
            uci: `m${index + 1}`,
            classification,
            accuracy: 90 - index,
          }),
        )}
        selectedPly={1}
        onSelect={() => undefined}
      />,
    );

    for (const { displayedType, glyph } of classifications) {
      const widget = screen.getByLabelText(displayedType);
      expect(widget).toBeInTheDocument();
      if (glyph) expect(widget).toHaveTextContent(glyph);
      expect(screen.getByText(new RegExp(`^${displayedType} - \\d+%$`))).toBeInTheDocument();
    }
  });

  it("shows forced moves as their own move type", () => {
    render(<MoveList moves={[move({ classification: "Forced", accuracy: 100 })]} selectedPly={1} onSelect={() => undefined} />);

    expect(screen.getByLabelText("Forced")).toHaveTextContent("F");
    expect(screen.getByText("Forced - 100%")).toBeInTheDocument();
  });

  it("keeps unclassified moves readable and selectable", () => {
    const onSelect = vi.fn();
    render(<MoveList moves={[move({ classification: undefined, accuracy: undefined })]} selectedPly={0} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /e4/i }));

    expect(screen.getByText("Unclassified - N/A")).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
