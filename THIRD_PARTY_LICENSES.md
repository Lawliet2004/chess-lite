# Third-party licenses

## Stockfish.js / Stockfish 18 Lite

- Package: `stockfish@18.0.8`
- Bundled files: `public/engine/stockfish-18-lite-single.js`, `public/engine/stockfish-18-lite-single.wasm`
- Stockfish.js source: <https://github.com/nmrugg/stockfish.js>
- Upstream Stockfish source: <https://github.com/official-stockfish/Stockfish>
- npm package: <https://www.npmjs.com/package/stockfish/v/18.0.8>
- License: GNU General Public License, version 3
- Complete license text included by the package at `node_modules/stockfish/Copying.txt` and published at <https://www.gnu.org/licenses/gpl-3.0.txt>

Stockfish.js is a WebAssembly distribution of Stockfish. It is intentionally copied into `dist/engine` as a separate engine asset. Distributors must preserve the GPL notice and provide the corresponding source as required by GPLv3. No claim is made that Stockfish is part of the extension’s proprietary UI source.

## Other dependencies

React, Vite, TypeScript, chess.js, Dexie, Zustand, Lucide React, Tailwind CSS, Vitest, and their transitive dependencies retain their respective licenses. Exact versions are recorded in `package-lock.json`; package license files remain in `node_modules` after installation.
