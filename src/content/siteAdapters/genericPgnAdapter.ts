import { Chess } from "chess.js";

export function movesToPgn(moves: string[], headers: Record<string, string> = {}): string | undefined {
  const normalized = moves.flatMap((value) => value
    .replace(/\d+\.(?:\.\.)?/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !/^(?:1-0|0-1|½-½|\*)$/.test(token)));
  if (!normalized.length || normalized.length > 1000) return undefined;
  const chess = new Chess();
  try { for (const san of normalized) chess.move(san); } catch { return undefined; }
  const entries = Object.entries(headers).flat(); if (entries.length) chess.header(...entries);
  return chess.pgn();
}

export function findEmbeddedPgn(doc: Document): string | undefined {
  const direct = doc.querySelector<HTMLElement>("[data-pgn]")?.dataset.pgn;
  if (direct?.includes("1.")) return direct;
  for (const script of [...doc.querySelectorAll("script[type='application/ld+json'], script[type='application/json']")]) {
    const text = script.textContent?.slice(0, 1_000_000); if (!text || !text.includes("pgn")) continue;
    try {
      const json = JSON.parse(text);
      const stack: unknown[] = [json];
      while (stack.length) { const value = stack.pop(); if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) { if (/pgn/i.test(key) && typeof child === "string" && child.includes("1.")) return child; if (child && typeof child === "object") stack.push(child); } }
    } catch { /* Ignore unrelated page state. */ }
  }
  return undefined;
}

export async function fetchExportPgn(doc: Document, allowedHost: string): Promise<string | undefined> {
  const link = [...doc.querySelectorAll<HTMLAnchorElement>("a[href]")].find((anchor) => /pgn|export/i.test(`${anchor.href} ${anchor.textContent}`));
  if (!link) return undefined;
  const url = new URL(link.href, location.href); if (url.hostname !== allowedHost || url.protocol !== "https:") return undefined;
  try { const response = await fetch(url, { credentials: "include" }); const text = await response.text(); return response.ok && text.length <= 1_000_000 && text.includes("1.") ? text : undefined; } catch { return undefined; }
}
