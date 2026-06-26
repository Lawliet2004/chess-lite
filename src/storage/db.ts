import Dexie, { type EntityTable } from "dexie";
import type { StoredGame } from "./models";

export class ChessLiteDatabase extends Dexie {
  games!: EntityTable<StoredGame, "id">;
  constructor() {
    super("chesslite-review");
    this.version(1).stores({ games: "id, updatedAt, source, [white+black]" });
  }
}

export const db = new ChessLiteDatabase();
