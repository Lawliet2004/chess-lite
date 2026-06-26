# Contributing

Thanks for improving ChessLite Review. Keep changes small, tested, and aligned with the fair-play boundary in the README.

## Local workflow

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Use `npm run demo` while working on presentation changes. Use `npm run dev` when testing the extension bundle in Chrome.

## Pull request checklist

- The change has a focused scope.
- Tests cover changed analysis, parsing, storage, or fair-play behavior.
- UI changes work at narrow and desktop widths.
- No generated `dist/`, `node_modules/`, credentials, local browser profiles, or private PGNs are committed.
- Any extension permission change is explained in the PR.

## Fair-play boundary

Do not add features that assist active games, click board squares, automate moves, bypass site state detection, or send private game data to a service without explicit user control.
