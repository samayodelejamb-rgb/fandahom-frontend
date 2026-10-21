import { createContext, useContext, useState, useEffect } from "react";
import { setUnauthorizedHandler } from "../services/apiClient";
import {
  fetchCsrfToken,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
} from "../services/authApi";

const AuthContext = createContext();

// NOTE: The backend API has no endpoints yet for wishlist or profile
// updates (checked against the doc from the backend dev). Those two
// features are kept local-only (localStorage, keyed by user id) until
// real endpoints exist. Everything else below (login/logout/session
// restore) talks to the real API shape. Registration and password reset
// are two-step email-code flows that don't start a session, so they live
// in authApi.js and are called straight from their pages.
function wishlistStorageKey(userId) {
  return `fandahom_wishlist_${userId}`;
}

function loadWishlist(userId) {
  try {
    const raw = localStorage.getItem(wishlistStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWishlist(userId, wishlist) {
  localStorage.setItem(wishlistStorageKey(userId), JSON.stringify(wishlist));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // If the backend says "401" while someone is using the app (their
  // session expired), sign them out locally. ProtectedRoute then sends
  // them to the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setWishlist([]);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // On first load: get a CSRF token, then ask the backend who (if anyone)
  // is currently logged in via the session cookie. This replaces the old
  // "read a fake user out of localStorage" approach with a real check.
  useEffect(() => {
    (async () => {
      try {
        await fetchCsrfToken();
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setWishlist(loadWishlist(currentUser.id));
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password, pendingWishlistId) => {
    const loggedInUser = await loginRequest({ email, password });
    // Starting a session changes Django's CSRF token, so get a fresh one
    // before any further POST/DELETE.
    await fetchCsrfToken();
    let wl = loadWishlist(loggedInUser.id);
    if (pendingWishlistId && !wl.includes(pendingWishlistId)) {
      wl = [...wl, pendingWishlistId];
      saveWishlist(loggedInUser.id, wl);
    }
    setUser(loggedInUser);
    setWishlist(wl);
    return loggedInUser;
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
    setWishlist([]);
    await fetchCsrfToken();
  };

  // No backend endpoint exists yet for editing profile fields.
  // This is a local-only stand-in so the UI keeps working; swap this
  // for a real PATCH/PUT request once that endpoint exists.
  const updateProfile = (updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const toggleWishlist = (propertyId) => {
    if (!user) return;
    setWishlist((prev) => {
      const alreadySaved = prev.includes(propertyId);
      const updated = alreadySaved
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];
      saveWishlist(user.id, updated);
      return updated;
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    wishlist,
    login,
    logout,
    updateProfile,
    toggleWishlist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
