import { Chess } from "chess.js";
import { useMemo, useState, useEffect } from "react";
import type { MoveClassification } from "../../storage/models";
import { MoveTypeWidget } from "./MoveTypeWidget";

const files = "abcdefgh";

function center(square: string, flipped: boolean): [number, number] {
  const file = files.indexOf(square[0]);
  const rank = 8 - Number(square[1]);
  return flipped
    ? [(7 - file + 0.5) * 12.5, (7 - rank + 0.5) * 12.5]
    : [(file + 0.5) * 12.5, (rank + 0.5) * 12.5];
}

function Arrow({ uci, color, flipped, marker }: { uci?: string; color: string; flipped: boolean; marker: string }) {
  if (!uci || uci.length < 4) return null;
  const [x1, y1] = center(uci.slice(0, 2), flipped);
  const [x2, y2] = center(uci.slice(2, 4), flipped);
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth="2.8" strokeLinecap="round"
      markerEnd={`url(#${marker})`} opacity=".85"
    />
  );
}

export function ChessBoard({
  fen,
  playedMove,
  moveClassification,
  bestMove,
  flipped = false,
  showArrows = true,
}: {
  fen: string;
  playedMove?: string;
  moveClassification?: MoveClassification;
  bestMove?: string;
  flipped?: boolean;
  showArrows?: boolean;
}) {
  const board = useMemo(() => new Chess(fen).board(), [fen]);
  const squares = board.flatMap((rank, rankIndex) =>
    rank.map((piece, fileIndex) => ({
      piece,
      rankIndex,
      fileIndex,
      square: `${files[fileIndex]}${8 - rankIndex}`,
    })),
  );
  if (flipped) squares.reverse();

  const lastSquares = new Set([playedMove?.slice(0, 2), playedMove?.slice(2, 4)]);
  const playedDestination = playedMove?.slice(2, 4);

  // Right-click drawing states
  const [userArrows, setUserArrows] = useState<string[]>([]);
  const [userHighlights, setUserHighlights] = useState<Set<string>>(new Set());
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [currentDrag, setCurrentDrag] = useState<string | null>(null);

  // Clear drawings when the position (FEN) changes
  useEffect(() => {
    setUserArrows([]);
    setUserHighlights(new Set());
  }, [fen]);

  // Handle global mouseup to safely reset right-click drag state
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setDragStart(null);
      setCurrentDrag(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  return (
    <div className="board-wrap" aria-label="Chess board">
      <div 
        className="chessboard"
        onContextMenu={(e) => e.preventDefault()}
      >
        {squares.map(({ piece, rankIndex, fileIndex, square }, index) => {
          const isLight = (rankIndex + fileIndex) % 2 === 0;
          const isLast = lastSquares.has(square);
          const showMoveType = Boolean(moveClassification && square === playedDestination);
          const isHighlighted = userHighlights.has(square);
          
          // Row/Col index in visually rendered grid (0 to 7)
          const colIndex = index % 8;
          const rowIndex = Math.floor(index / 8);
          
          // In Chess.com style, coords are inside squares on the edges
          const showRank = colIndex === 0;
          const showFile = rowIndex === 7;
          
          const rankLabel = square[1];
          const fileLabel = square[0];

          // Mouse event handlers for right-click drawing
          const handleMouseDown = (e: React.MouseEvent) => {
            if (e.button === 2) {
              e.preventDefault();
              setDragStart(square);
              setCurrentDrag(square);
            } else if (e.button === 0) {
              // Left click clears all arrows and highlights
              setUserArrows([]);
              setUserHighlights(new Set());
            }
          };

          const handleMouseEnter = () => {
            if (dragStart) {
              setCurrentDrag(square);
            }
          };

          const handleMouseUp = (e: React.MouseEvent) => {
            if (e.button === 2 && dragStart) {
              e.preventDefault();
              if (dragStart === square) {
                // Toggle square highlight
                setUserHighlights((prev) => {
                  const next = new Set(prev);
                  if (next.has(square)) {
                    next.delete(square);
                  } else {
                    next.add(square);
                  }
                  return next;
                });
              } else {
                // Toggle arrow
                const uci = `${dragStart}${square}`;
                setUserArrows((prev) => {
                  if (prev.includes(uci)) {
                    return prev.filter((x) => x !== uci);
                  } else {
                    return [...prev, uci];
                  }
                });
              }
            }
          };

          return (
            <div
              key={square}
              className={`square${isLight ? " light" : " dark"}${isLast ? " last" : ""}${showMoveType ? " move-type-destination" : ""}${isHighlighted ? " highlighted" : ""}`}
              aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : " empty"}`}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
            >
              {showRank && (
                <span className={`square-coord rank-coord ${isLight ? "coord-dark" : "coord-light"}`}>
                  {rankLabel}
                </span>
              )}
              {showFile && (
                <span className={`square-coord file-coord ${isLight ? "coord-dark" : "coord-light"}`}>
                  {fileLabel}
                </span>
              )}
              {piece && (
                <img
                  src={`/pieces/neo/${piece.color}${piece.type}.png`}
                  alt={`${piece.color === "w" ? "white" : "black"} ${piece.type}`}
                  className="piece"
                  draggable="false"
                />
              )}
              {showMoveType && <MoveTypeWidget classification={moveClassification} className="board-move-type-widget" />}
            </div>
          );
        })}

        {/* Arrow SVG overlay */}
        {showArrows && (
          <svg className="board-arrows" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <marker id="playedHead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4 z" fill="rgba(255,170,0,0.9)" />
              </marker>
              <marker id="bestHead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4 z" fill="rgba(50,180,100,0.9)" />
              </marker>
              <marker id="userHead" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4 z" fill="rgba(244,67,54,0.9)" />
              </marker>
            </defs>
            <Arrow uci={playedMove} color="rgba(255,170,0,0.75)" flipped={flipped} marker="playedHead" />
            <Arrow uci={bestMove} color="rgba(50,180,100,0.75)" flipped={flipped} marker="bestHead" />
            
            {/* Custom user arrows */}
            {userArrows.map((uci) => (
              <Arrow key={uci} uci={uci} color="rgba(244,67,54,0.85)" flipped={flipped} marker="userHead" />
            ))}
            {/* Preview of arrow currently being dragged */}
            {dragStart && currentDrag && dragStart !== currentDrag && (
              <Arrow uci={`${dragStart}${currentDrag}`} color="rgba(244,67,54,0.55)" flipped={flipped} marker="userHead" />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}
