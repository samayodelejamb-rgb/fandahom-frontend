import { apiRequest, fetchCsrfToken } from "./apiClient";

// ---------------------------------------------------------------------
// Registration — two steps (email code), per the API doc
// ---------------------------------------------------------------------

/**
 * Step 1: send a 6-digit code to the email. No account exists yet.
 * Errors: 409 email already registered, 429 too many codes (3 per hour).
 */
export async function requestRegistrationCode(email) {
  const data = await apiRequest("/core/auth/register/", {
    method: "POST",
    body: { email },
  });
  return data.message;
}

/**
 * Step 2: check the code and create the account. This does NOT log the
 * user in — send them to the login page afterwards.
 */
export async function verifyRegistration({
  email,
  code,
  firstname,
  lastname,
  password,
  passwordConfirmation,
}) {
  const data = await apiRequest("/core/auth/register/verify/", {
    method: "POST",
    body: {
      email,
      code,
      firstname,
      lastname,
      password,
      password_confirmation: passwordConfirmation,
    },
  });
  return data.user;
}

// ---------------------------------------------------------------------
// Password reset — two steps (email code), per the API doc
// ---------------------------------------------------------------------

/**
 * Step 1: send a reset code. The backend answers 200 even when the email
 * isn't registered (so nobody can discover which emails have accounts).
 */
export async function requestPasswordReset(email) {
  const data = await apiRequest("/core/auth/password/reset/", {
    method: "POST",
    body: { email },
  });
  return data.message;
}

/**
 * Step 2: check the code and set the new password. Does not log in.
 */
export async function confirmPasswordReset({ email, code, password, passwordConfirmation }) {
  await apiRequest("/core/auth/password/reset/verify/", {
    method: "POST",
    body: {
      email,
      code,
      password,
      password_confirmation: passwordConfirmation,
    },
  });
}

// ---------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------

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
  const data = await apiRequest("/core/auth/me", { timeoutMs: 8000 });
  return data.user; // null if not logged in
}

export { fetchCsrfToken };
