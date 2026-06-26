import { db } from "./db";
import type { StoredGame } from "./models";

export const gameRepository = {
  save: (game: StoredGame) => db.games.put(game),
  get: (id: string) => db.games.get(id),
  recent: (limit = 8) => db.games.orderBy("updatedAt").reverse().limit(limit).toArray(),
  remove: (id: string) => db.games.delete(id),
};
