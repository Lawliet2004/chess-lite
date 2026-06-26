export function createStockfishWorker(): Worker {
  const url = typeof chrome !== "undefined" && chrome.runtime?.id
    ? chrome.runtime.getURL("engine/stockfish-18-lite-single.js")
    : "/engine/stockfish-18-lite-single.js";
  return new Worker(url);
}
