import type { GameContext } from "../fairPlayGuard";

export function mountReviewButton(context: GameContext, onReview: () => void): void {
  document.getElementById("chesslite-review-host")?.remove();
  const host = document.createElement("div"); host.id = "chesslite-review-host"; const shadow = host.attachShadow({ mode: "closed" });
  const button = document.createElement("button"); const enabled = context.status === "finished" || context.status === "analysis";
  button.textContent = enabled ? "♞  Review with ChessLite" : "Review becomes available after the game ends.";
  button.disabled = !enabled; button.setAttribute("aria-label", button.textContent);
  const style = document.createElement("style"); style.textContent = `button{position:fixed;right:18px;bottom:18px;z-index:2147483647;border:1px solid rgba(255,255,255,.2);border-radius:8px;padding:10px 14px;background:#1677d2;color:white;box-shadow:0 8px 24px rgba(0,0,0,.28);font:600 13px "Segoe UI",sans-serif;cursor:pointer}button:disabled{background:#39434d;color:#ccd3d9;cursor:not-allowed;max-width:260px}`;
  button.addEventListener("click", onReview); shadow.append(style, button); document.documentElement.append(host);
}
