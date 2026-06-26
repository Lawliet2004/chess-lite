import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const pieces = ["wp", "wn", "wb", "wr", "wq", "wk", "bp", "bn", "bb", "br", "bq", "bk"];
const targetDir = "public/pieces/neo";

mkdirSync(targetDir, { recursive: true });

async function download(piece) {
  const url = `https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${piece}.png`;
  const path = `${targetDir}/${piece}.png`;
  
  if (existsSync(path)) {
    console.log(`Piece ${piece} already downloaded.`);
    return;
  }

  console.log(`Downloading ${piece} from ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    writeFileSync(path, Buffer.from(buffer));
    console.log(`Saved ${piece} successfully.`);
  } catch (err) {
    console.error(`Failed to download ${piece}:`, err);
  }
}

async function main() {
  for (const piece of pieces) {
    await download(piece);
  }
}

main();
