import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { USING_MOCK_API } from "./config";

// How long we wait for the mock backend's service worker before giving up.
const MOCK_START_TIMEOUT_MS = 8000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Mock backend start timed out")), ms)
    ),
  ]);
}

// sessionStorage can throw in some private-browsing modes, so never let
// it crash startup.
function safeSessionGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

// Shown only when the mock backend couldn't start. Inline styles so it
// doesn't depend on any CSS file.
function MockBackendWarning() {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        padding: "0.85rem 1rem",
        background: "#101c34",
        color: "white",
        fontSize: "0.85rem",
        lineHeight: 1.5,
        textAlign: "center",
      }}
    >
      The demo backend couldn&apos;t start in this browser, so listings and login won&apos;t
      work. If you opened this link inside WhatsApp, Instagram or a similar app, open it in
      Safari or Chrome instead.
    </div>
  );
}

class SkipMock extends Error {}

async function startApp() {
  // The in-browser mock server (MSW) runs only when no real backend URL is
  // configured (see src/config.js). Set VITE_API_URL to use the real one.
  let mockReady = true;

  try {
    if (!USING_MOCK_API) {
      throw new SkipMock();
    }

    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers are not available in this browser");
    }

    const { worker } = await import("./mocks/msw/browser");

    // Safari (especially iOS) sometimes doesn't have the freshly-registered
    // service worker "controlling" the page on its very first load, so the
    // first request(s) slip through unintercepted and fail. If that's the
    // case, force one silent reload so the now-active worker takes over.
    const alreadyControlled = !!navigator.serviceWorker.controller;

    await withTimeout(
      worker.start({
        onUnhandledRequest: "bypass", // don't warn about requests we're not mocking
      }),
      MOCK_START_TIMEOUT_MS
    );

    if (!alreadyControlled && !safeSessionGet("msw-reloaded")) {
      safeSessionSet("msw-reloaded", "1");
      window.location.reload();
      return; // stop here — the reload will re-run this whole file
    }
  } catch (err) {
    if (err instanceof SkipMock) {
      // Using the real backend: nothing to start, nothing to warn about.
    } else {
      // Before this, a failure here meant a blank white screen. Now the app
      // still renders, with a visible explanation.
      console.error("Mock backend failed to start:", err);
      mockReady = false;
    }
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
      {!mockReady && <MockBackendWarning />}
    </StrictMode>
  );
}

startApp();
