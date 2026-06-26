import { isExtensionMessage } from "../utils/messaging";
import { beginOpenReview } from "./openReviewFlow";

chrome.runtime.onInstalled.addListener(() => { void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }); });
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isExtensionMessage(message) || message.type !== "OPEN_REVIEW") return false;
  void beginOpenReview(message, sender.tab?.id, {
    openPanel: (tabId) => chrome.sidePanel.open({ tabId }),
    savePending: (pendingReview) => chrome.storage.session.set({ pendingReview }),
  }).then(sendResponse);
  return true;
});
