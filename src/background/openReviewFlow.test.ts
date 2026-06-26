import { beginOpenReview } from "./openReviewFlow";

describe("review side-panel launch", () => {
  it("invokes sidePanel.open synchronously before yielding", async () => {
    const events: string[] = [];
    const resultPromise = beginOpenReview(
      { type: "OPEN_REVIEW", tabId: 42, pgn: "1. e4 e5 *" },
      undefined,
      {
        openPanel: async (tabId) => { events.push(`open:${tabId}`); },
        savePending: async () => { events.push("save"); },
      },
    );

    expect(events[0]).toBe("open:42");
    await expect(resultPromise).resolves.toEqual({ ok: true });
  });

  it("uses the sender tab for content-script launches", async () => {
    let openedTab: number | undefined;
    await beginOpenReview(
      { type: "OPEN_REVIEW", pgn: "1. d4 d5 *" },
      9,
      { openPanel: async (tabId) => { openedTab = tabId; }, savePending: async () => undefined },
    );
    expect(openedTab).toBe(9);
  });

  it("returns a useful failure when no target tab is available", async () => {
    await expect(beginOpenReview(
      { type: "OPEN_REVIEW" },
      undefined,
      { openPanel: async () => undefined, savePending: async () => undefined },
    )).resolves.toEqual({ ok: false, error: "No active tab is available for the review panel." });
  });
});
