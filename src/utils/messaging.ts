import type { GameContext } from "../content/fairPlayGuard";

export type ExtensionMessage =
  | { type: "GET_PAGE_CONTEXT" }
  | { type: "PAGE_CONTEXT"; context: GameContext; pgn?: string }
  | { type: "OPEN_REVIEW"; pgn?: string; tabId?: number; autoStart?: boolean }
  | { type: "IMPORT_PGN"; pgn: string };

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  if (typeof message.type !== "string") return false;
  if (!new Set(["GET_PAGE_CONTEXT", "PAGE_CONTEXT", "OPEN_REVIEW", "IMPORT_PGN"]).has(message.type)) return false;
  if (message.tabId !== undefined && (!Number.isInteger(message.tabId) || Number(message.tabId) < 0)) return false;
  if (message.autoStart !== undefined && typeof message.autoStart !== "boolean") return false;
  return message.pgn === undefined || (typeof message.pgn === "string" && message.pgn.length <= 1_000_000);
}
