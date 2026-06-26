import { Chess, type Move } from "chess.js";

export const MAX_PGN_LENGTH = 1_000_000;

export type ParsedPgn = {
  headers: Record<string, string>;
  moves: Move[];
  pgn: string;
};

export function parsePgn(raw: string): ParsedPgn {
  const pgn = raw.replace(/\0/g, "").trim();
  if (!pgn) throw new Error("PGN is empty");
  if (pgn.length > MAX_PGN_LENGTH) throw new Error("PGN is too large");

  const chess = new Chess();
  try {
    chess.loadPgn(pgn, { strict: false });
  } catch {
    throw new Error("Invalid or unsupported PGN");
  }

  const headers = Object.fromEntries(Object.entries(chess.header()).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  const variant = headers.Variant?.toLowerCase();
  if (variant && !["standard", "chess"].includes(variant)) throw new Error("Unsupported chess variant");
  const moves = chess.history({ verbose: true });
  if (!moves.length) throw new Error("PGN contains no moves");
  return { headers, moves, pgn };
}
