export type OpenReviewRequest = {
  type: "OPEN_REVIEW";
  pgn?: string;
  tabId?: number;
  autoStart?: boolean;
};

export type PendingReview = {
  requestId: string;
  pgn?: string;
  autoStart: boolean;
  createdAt: number;
};

type OpenReviewDependencies = {
  openPanel: (tabId: number) => Promise<void>;
  savePending: (pending: PendingReview) => Promise<void>;
};

export type OpenReviewResult = { ok: true } | { ok: false; error: string };

export async function beginOpenReview(
  message: OpenReviewRequest,
  senderTabId: number | undefined,
  dependencies: OpenReviewDependencies,
): Promise<OpenReviewResult> {
  const tabId = senderTabId ?? message.tabId;
  if (tabId === undefined) return { ok: false, error: "No active tab is available for the review panel." };

  try {
    // Chrome requires sidePanel.open() to be invoked synchronously while the
    // click's user activation is still attached to this message handler.
    const opening = dependencies.openPanel(tabId);
    const saving = dependencies.savePending({
      requestId: crypto.randomUUID(),
      pgn: message.pgn,
      autoStart: message.autoStart === true && Boolean(message.pgn),
      createdAt: Date.now(),
    });
    await Promise.all([opening, saving]);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not open the review panel." };
  }
}
