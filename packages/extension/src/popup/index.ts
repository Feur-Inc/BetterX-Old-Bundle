import browser from "webextension-polyfill";

const dot = document.getElementById("status-dot");
const text = document.getElementById("status-text");

// Check if X.com is open in any tab
browser.tabs
  .query({ url: ["*://x.com/*", "*://twitter.com/*"] })
  .then((tabs) => {
    if (tabs.length > 0) {
      dot?.classList.add("active");
      if (text) text.textContent = "Active on X.com";
    } else {
      if (text) text.textContent = "Not running - open X.com to start";
    }
  })
  .catch(() => {
    if (text) text.textContent = "Not running - open X.com to start";
  });

document.getElementById("open-tab")?.addEventListener("click", () => {
  void browser.tabs.create({ url: "https://x.com" });
});
