import { isExtensionMessage } from "./messaging";

describe("extension message validation", () => {
  it("accepts a bounded review request with an explicit target tab", () => {
    expect(isExtensionMessage({ type: "OPEN_REVIEW", tabId: 12, pgn: "1. e4 *", autoStart: true })).toBe(true);
  });

  it("rejects malformed target tabs and auto-start flags", () => {
    expect(isExtensionMessage({ type: "OPEN_REVIEW", tabId: -1 })).toBe(false);
    expect(isExtensionMessage({ type: "OPEN_REVIEW", autoStart: "yes" })).toBe(false);
  });
});
