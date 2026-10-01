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
const AUTH_PATHS = ["/core/auth/login", "/core/auth/register", "/core/auth/logout"];

/**
 * Fetches a CSRF token from the backend and caches it in memory.
 * Must be called once before any POST/DELETE request is made
 * (e.g. on app load). Safe to call again if a request comes back
 * with a stale-token error.
 */
export async function fetchCsrfToken() {
  const res = await fetch(`${BASE_URL}/core/auth/csrf`, {
    credentials: "include",
  });
  const data = await res.json();
  csrfToken = data.csrf_token;
  return csrfToken;
}

/**
 * Core request helper. All service files (authApi, listingApi, mediaApi)
 * call this instead of using fetch() directly.
 *
 * @param {string} path - e.g. "/core/auth/login"
 * @param {object} options - { method, body, isJson }
 */
export async function apiRequest(path, { method = "GET", body, isJson = true } = {}) {
  const headers = {};

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  // CSRF token is required on any state-changing request (POST/DELETE).
  const isMutating = method === "POST" || method === "DELETE" || method === "PUT" || method === "PATCH";
  if (isMutating) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    headers["X-CSRFToken"] = csrfToken;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include", // sends/receives the session cookie
    body: body ? (isJson ? JSON.stringify(body) : body) : undefined,
  });

  // 204/empty body responses (e.g. logout, delete) won't have JSON to parse.
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

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