# ChessLite Review

ChessLite Review is a Manifest V3 browser extension for private, local post-game chess analysis. It parses completed games or imported PGNs, evaluates every move with Stockfish 18 Lite WebAssembly, and presents an interactive Fluent-style review with accuracy scores, classifications, best moves, engine lines, critical moments, and an evaluation graph.

## Fair-play boundary

ChessLite Review never provides engine assistance during an active game. Site adapters fail closed: engine-powered review is enabled only when a supported page is clearly finished, is a non-live analysis/study board, or the user explicitly imports a PGN. Unknown and active states display: **"Review becomes available after the game ends."**

The extension never clicks board squares, submits moves, automates play, injects an engine into the page context, uploads games, or runs analytics.

## Features

- Chrome/Chromium Manifest V3 popup, content integration, and side panel
- Local `stockfish-18-lite-single.js` + WASM worker; no CDN or remote code
- PGN parsing, headers, comments, castling, promotion, en passant, and custom start FENs through `chess.js`
- White-perspective internal evaluation with mover-perspective CP/Stockfish-WDL loss
- Lichess-documented Win% move accuracy and volatility/harmonic game accuracy
- Bounded single-game performance estimate with an uncertainty range
- Fast, Balanced, Deep, and Custom review settings
- Move classifications from Book through Blunder, Missed Win, Great Move, and conservative Brilliant Candidate
- Interactive board, played/best arrows, move list, eval graph, navigation, explanations, and critical moments
- IndexedDB review history via Dexie
- Annotated PGN and JSON export
- Light/dark system theme, keyboard-accessible controls, responsive layout

## Build from source

Requirements: Node.js 20 or newer and npm.

```powershell
npm install
npm run typecheck
npm test
npm run lint
npm run build
```

`npm run build` generates the extension icons, compiles the TypeScript/React entries, and copies the pinned Stockfish 18 Lite single-threaded engine from `node_modules/stockfish/bin` into `dist/engine`.

## Load unpacked in Chrome

1. Build the project.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the generated `dist` directory.

## Use

On a clearly completed Chess.com or Lichess game, select **Review with ChessLite** or use the popup. If automatic extraction is unavailable, choose **Import PGN**, paste the game, select a review mode, and start the local review. Click moves or graph points to navigate. PGN and JSON export buttons appear in the details panel.

## How analysis works

For every ply, ChessLite analyzes the position before the played move and the resulting position. Stockfish scores are normalized to White's perspective; loss is then calculated from the mover's perspective. Move accuracy uses Lichess's published Win% and Accuracy% equations, including its uncertainty bonus. Game accuracy combines a volatility-weighted mean with a harmonic mean. Stockfish's native `UCI_ShowWDL` output is used for position-sensitive move severity. Mate values remain distinct from centipawns and are capped only when a finite value is required by the published Win% model or graph.

The displayed performance rating is an approximate, bounded range derived from this game's non-book move quality. It is not the player's account Elo and deliberately reports only low or medium confidence.

Primary references:

- <https://lichess.org/page/accuracy>
- <https://github.com/lichess-org/lila/blob/master/modules/analyse/src/main/AccuracyPercent.scala>
- <https://github.com/official-stockfish/Stockfish/blob/master/src/uci.cpp>

The first pass is sequential for browser stability. Results are cached by FEN and engine settings. Stopping analysis preserves the partial in-memory review.

## Privacy and security

- No backend, telemetry, tracking, or game upload
- No remote scripts and no `eval`
- React escapes PGN metadata and comments; no `dangerouslySetInnerHTML`
- PGN size is capped at 1 MB and unsupported variants are rejected
- Extension messages are allowlisted and length-validated
- Only `storage`, `activeTab`, `sidePanel`, and the two supported host origins are requested
- The engine runs only in an extension-owned Worker

## Tests

The Vitest suite covers PGN parsing/reconstruction, UCI parsing, evaluation normalization, mate handling, mover-perspective accuracy, classifications, fair-play gating, report summaries, and annotated PGN export. Sample PGNs are under `tests/fixtures`.

## Honest limitations

- Stockfish 18 Lite is smaller and weaker than full Stockfish.
- Local CPU results can differ from Chess.com or Lichess server review.
- Brilliant Candidate and tactical tags are conservative heuristics, not objective labels.
- A single game cannot determine a player's actual Elo; the performance estimate is heuristic and intentionally broad.
- Deep review may be slow on low-end devices.
- Site extraction can break when supported sites change markup; manual PGN import remains available.
- Opening detection uses PGN `Opening`/`ECO` headers; there is no bundled ECO database yet.

## Roadmap

Full and multithreaded engine modes, a local ECO database, optional user-enabled tablebases, privacy-preserving user-key LLM explanations, stronger sacrifice detection, mistake-to-puzzle training, longitudinal reports, PDF export, and opt-in sync.

## License

The extension source and Stockfish are separate components. Stockfish.js/Stockfish is GPLv3; see [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md). Any distribution containing the engine must comply with GPLv3 source-availability obligations.
