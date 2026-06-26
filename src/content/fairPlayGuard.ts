export type GameContext =
  | { status: "active"; reason: string }
  | { status: "finished"; result?: string }
  | { status: "analysis"; reason: string }
  | { status: "unknown" };

export function canEnableEngineReview(ctx: GameContext): boolean {
  return ctx.status === "finished" || ctx.status === "analysis";
}

const ACTIVE_SELECTORS = [
  "[data-game-status='playing']",
  "[data-state='playing']",
  ".clock-running",
  ".clock-player-turn",
  ".rclock.running",
  ".clock-component.clock-player-turn",
  ".live-game-buttons",
];

const FINISHED_SELECTORS = [
  "[data-game-status='finished']",
  "[data-state='finished']",
  ".game-over-modal",
  "[data-cy='game-over-modal']",
  ".game-over-header-component",
  ".game-over-review-button-component",
  ".game-over-message-component",
  ".result-wrap",
  ".game__meta .result",
  ".game__meta p.status",
  ".analyse__moves .result",
  ".game__meta__players .result",
];

export function isGameOverOrAnalysisMode(doc: Document = document, url = new URL(location.href)): GameContext {
  if (ACTIVE_SELECTORS.some((selector) => doc.querySelector(selector))) {
    return { status: "active", reason: "Live-game indicators are present" };
  }

  const path = url.pathname.toLowerCase();
  if (/\/(analysis|study|editor)(\/|$)/.test(path)) {
    return { status: "analysis", reason: "Non-live analysis board detected" };
  }

  if (FINISHED_SELECTORS.some((selector) => doc.querySelector(selector))) {
    const result = doc.body.textContent?.match(/(?:1-0|0-1|½-½)/)?.[0];
    return { status: "finished", result };
  }

  return { status: "unknown" };
}
