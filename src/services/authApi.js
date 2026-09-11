import { apiRequest, fetchCsrfToken } from "./apiClient";

/**
 * Register a new user.
 * Backend expects: firstname, lastname, email, password, password_confirmation
 */
export async function registerRequest({ firstname, lastname, email, password, passwordConfirmation }) {
  const data = await apiRequest("/core/auth/register", {
    method: "POST",
    body: {
      firstname,
      lastname,
      email,
      password,
      password_confirmation: passwordConfirmation,
    },
  });
  return data.user;
}

/**
 * Log in with email + password. Backend sets a session cookie on success.
 */
export async function loginRequest({ email, password }) {
  const data = await apiRequest("/core/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return data.user;
}

/**
 * End the current session.
 */
export async function logoutRequest() {
  await apiRequest("/core/auth/logout", { method: "POST" });
}

/**
 * Ask the backend who's currently logged in (based on the session cookie).
 * Returns null if nobody is logged in — this is how we restore login
 * state on page refresh instead of trusting localStorage.
 */
export async function fetchCurrentUser() {
  const data = await apiRequest("/core/auth/me");
  return data.user; // null if not logged in
}

export { fetchCsrfToken };