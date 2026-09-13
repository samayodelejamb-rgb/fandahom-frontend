import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

async function startApp() {
  // MSW currently runs in EVERY environment (including production builds
  // like Netlify), since there is no real backend deployed anywhere yet.
  // Once the real backend has a live URL, this should go back to DEV-only
  // and apiClient.js's BASE_URL should point at that real URL instead.
  const { worker } = await import("./mocks/msw/browser");

  // Safari (especially iOS) sometimes doesn't have the freshly-registered
  // service worker "controlling" the page on its very first load, so the
  // first request(s) slip through unintercepted and fail. If that's the
  // case, force one silent reload so the now-active worker takes over.
  const alreadyControlled = !!navigator.serviceWorker?.controller;

  await worker.start({
    onUnhandledRequest: "bypass", // don't warn about requests we're not mocking
  });

  if (!alreadyControlled && !sessionStorage.getItem("msw-reloaded")) {
    sessionStorage.setItem("msw-reloaded", "1");
    window.location.reload();
    return; // stop here — the reload will re-run this whole file
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

startApp();
