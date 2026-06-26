import { render, screen, within } from "@testing-library/react";
import { ChessBoard } from "./ChessBoard";

const AFTER_E4_FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const AFTER_QH5_FEN = "rnbqkbnr/pppppppp/8/7Q/8/8/PPPPPPPP/RNB1KBNR b KQkq - 1 1";

describe("ChessBoard", () => {
  it("shows the move type widget on the played move destination square", () => {
    render(<ChessBoard fen={AFTER_E4_FEN} playedMove="e2e4" moveClassification="Best" />);

    const destinationSquare = screen.getByLabelText(/^e4 white p$/);

    expect(within(destinationSquare).getByLabelText("Best")).toBeInTheDocument();
  });

  it("uses the shared 10-type display mapping on the board", () => {
    render(<ChessBoard fen={AFTER_QH5_FEN} playedMove="d1h5" moveClassification="Missed Win" />);

    const destinationSquare = screen.getByLabelText(/^h5 white q$/);

    expect(within(destinationSquare).getByLabelText("Miss")).toBeInTheDocument();
  });

  it("shows forced moves as their own board widget", () => {
    render(<ChessBoard fen={AFTER_E4_FEN} playedMove="e2e4" moveClassification="Forced" />);

    const destinationSquare = screen.getByLabelText(/^e4 white p$/);

    expect(within(destinationSquare).getByLabelText("Forced")).toHaveTextContent("F");
  });

  it("does not show a board move type widget for unclassified moves", () => {
    render(<ChessBoard fen={AFTER_E4_FEN} playedMove="e2e4" />);

    expect(screen.queryByLabelText("Best")).not.toBeInTheDocument();
  });
});
