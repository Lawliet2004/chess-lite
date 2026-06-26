export function sideToMoveFromFen(fen: string): "w" | "b" {
  const side = fen.split(/\s+/)[1]; if (side !== "w" && side !== "b") throw new Error("Invalid FEN side to move"); return side;
}
