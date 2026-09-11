import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

async function startApp() {
  // Only intercept requests with MSW during local development.
  // In production this block is skipped entirely, and fetch() calls
  // go straight to the real backend.
  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/msw/browser");
    await worker.start({
      onUnhandledRequest: "bypass", // don't warn about requests we're not mocking
    });
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

startApp();
