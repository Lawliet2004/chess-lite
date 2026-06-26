import { build } from "esbuild";

await build({
  entryPoints: ["src/content/index.ts"],
  outfile: "dist/content.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome116"],
  minify: true,
  sourcemap: false,
  legalComments: "none",
});
