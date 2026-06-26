import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

function extensionAssets(): Plugin {
  return {
    name: "chesslite-extension-assets",
    closeBundle() {
      mkdirSync("dist/engine", { recursive: true });
      copyFileSync("manifest.json", "dist/manifest.json");
      const engineDir = resolve("node_modules/stockfish/bin");
      if (existsSync(engineDir)) {
        for (const file of ["stockfish-18-lite-single.js", "stockfish-18-lite-single.wasm"]) {
          copyFileSync(resolve(engineDir, file), resolve("dist/engine", file));
        }
      }
      if (existsSync("public/icons")) cpSync("public/icons", "dist/icons", { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), extensionAssets()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        demo: resolve(__dirname, "src/demo/demo.html"),
        popup: resolve(__dirname, "src/popup/popup.html"),
        sidepanel: resolve(__dirname, "src/sidepanel/sidepanel.html"),
        background: resolve(__dirname, "src/background/serviceWorker.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
