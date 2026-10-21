// Central place for talking to the Fandahom backend.
// Handles: base URL, sending cookies, attaching the CSRF token to
// mutating requests, and turning error responses into thrown Errors
// so calling code can just try/catch.

import { API_BASE_URL as BASE_URL } from "../config";

let csrfToken = null;

// The doc's 401 means "not logged in". When the session expires while the
// user is using the app, any request can come back 401. AuthContext
// registers a function here that signs the user out locally, and the
// protected pages then send them to the login screen.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

// For these endpoints a 401 is a normal answer (e.g. wrong password on
// login), not an expired session, so they must NOT trigger the handler.
const AUTH_PATHS = [
  "/core/auth/login",
  "/core/auth/logout",
  "/core/auth/register/",
  "/core/auth/register/verify/",
  "/core/auth/password/reset/",
  "/core/auth/password/reset/verify/",
];

// How long to wait for the backend before giving up. Without a limit, a
// connection that hangs would leave the app waiting (and the page blank)
// forever.
const DEFAULT_TIMEOUT_MS = 15000;
const STARTUP_TIMEOUT_MS = 8000;

// fetch() with a time limit and plain-English errors instead of the
// browser's "Failed to fetch".
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    const error = new Error(
      err.name === "AbortError"
        ? "The server took too long to respond. Check your connection and try again."
        : "Can't reach the server. Check your connection and try again."
    );
    error.status = 0;
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches a CSRF token from the backend and caches it in memory.
 * Every POST and DELETE needs it (as the X-CSRFToken header). Call once on
 * app load; it's also re-fetched after login, because Django changes the
 * CSRF token when a session starts.
 */
export async function fetchCsrfToken() {
  const res = await fetchWithTimeout(
    `${BASE_URL}/core/auth/csrf`,
    { credentials: "include" },
    STARTUP_TIMEOUT_MS
  );
  const data = parseBody(await res.text());
  if (!res.ok || !data.csrf_token) {
    const error = new Error(`Couldn't start a secure session (status ${res.status}).`);
    error.status = res.status;
    throw error;
  }
  csrfToken = data.csrf_token;
  return csrfToken;
}

// Reads a response body as JSON without crashing on an HTML error page.
function parseBody(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/**
 * Core request helper. All service files (authApi, listingApi, mediaApi)
 * call this instead of using fetch() directly.
 *
 * @param {string} path - e.g. "/core/auth/login"
 * @param {object} options - { method, body, isJson, timeoutMs }
 */
export async function apiRequest(
  path,
  { method = "GET", body, isJson = true, timeoutMs = DEFAULT_TIMEOUT_MS } = {},
  isRetry = false
) {
  const headers = {};

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  // CSRF token is required on any state-changing request (POST/DELETE).
  const isMutating =
    method === "POST" || method === "DELETE" || method === "PUT" || method === "PATCH";
  if (isMutating) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    headers["X-CSRFToken"] = csrfToken;
  }

  const res = await fetchWithTimeout(
    `${BASE_URL}${path}`,
    {
      method,
      headers,
      credentials: "include", // sends/receives the session cookie
      body: body ? (isJson ? JSON.stringify(body) : body) : undefined,
    },
    timeoutMs
  );

  // Empty-body responses (e.g. logout, delete) have no JSON to parse.
  const data = parseBody(await res.text());

  // A 403 about CSRF usually means our cached token went stale (e.g. the
  // session changed). Fetch a fresh one and try the request once more.
  if (
    res.status === 403 &&
    isMutating &&
    !isRetry &&
    /csrf/i.test(data?.error || data?.detail || "")
  ) {
    await fetchCsrfToken();
    return apiRequest(path, { method, body, isJson, timeoutMs }, true);
  }

  if (res.status === 401 && !AUTH_PATHS.includes(path)) {
    if (unauthorizedHandler) unauthorizedHandler();
    const error = new Error("Please log in to continue.");
    error.status = 401;
    throw error;
  }

  if (!res.ok) {
    const message = data?.error || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}
