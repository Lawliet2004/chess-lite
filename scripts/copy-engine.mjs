import { copyFileSync, mkdirSync } from "node:fs";

const source = "node_modules/stockfish/bin";
const target = "public/engine";
mkdirSync(target, { recursive: true });
for (const file of ["stockfish-18-lite-single.js", "stockfish-18-lite-single.wasm"]) {
  copyFileSync(`${source}/${file}`, `${target}/${file}`);
}
