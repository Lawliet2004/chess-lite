import type { GameContext } from "../fairPlayGuard";
export type ExtractedGame = { context: GameContext; pgn?: string; source: "chess.com" | "lichess" };
export interface SiteAdapter { matches(url: URL): boolean; inspect(doc: Document, url: URL): Promise<ExtractedGame>; }
