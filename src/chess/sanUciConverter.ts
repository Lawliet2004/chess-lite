import { Chess } from "chess.js";

export function uciToSan(fen: string, uci?: string): string | undefined {
  if (!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return undefined;
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })?.san;
  } catch { return undefined; }
}
