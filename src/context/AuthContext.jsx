import { createContext, useContext, useState, useEffect } from "react";
import {
  fetchCsrfToken,
  fetchCurrentUser,
  loginRequest,
  registerRequest,
  logoutRequest,
} from "../services/authApi";

const AuthContext = createContext();

// NOTE: The backend API has no endpoints yet for wishlist or profile
// updates (checked against the doc from the backend dev). Those two
// features are kept local-only (localStorage, keyed by user id) until
// real endpoints exist. Everything else below (register/login/logout/
// session restore) talks to the real API shape.
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

  const login = async (email, password) => {
    const loggedInUser = await loginRequest({ email, password });
    setUser(loggedInUser);
    setWishlist(loadWishlist(loggedInUser.id));
    return loggedInUser;
  };

  const register = async ({ firstname, lastname, email, password, passwordConfirmation }) => {
    const newUser = await registerRequest({
      firstname,
      lastname,
      email,
      password,
      passwordConfirmation,
    });
    // Our mock backend auto-logs-in on register (matches typical real
    // backend behaviour, but confirm this with your backend dev).
    setUser(newUser);
    setWishlist([]);
    return newUser;
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
    setWishlist([]);
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
    register,
    logout,
    updateProfile,
    toggleWishlist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
