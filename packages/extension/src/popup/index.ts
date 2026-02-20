document.getElementById("open-tab")?.addEventListener("click", () => {
  chrome.tabs.create({ url: "https://x.com" });
});
