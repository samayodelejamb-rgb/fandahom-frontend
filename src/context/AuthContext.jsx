import { createContext, useContext, useState, useEffect } from "react";
import { mockUser } from "../mocks/mockUser";

const AuthContext = createContext();

const STORAGE_KEY = "fandahom_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if a user was already logged in before refresh
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persistUser = (userData) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === mockUser.email && password === mockUser.password) {
          const loggedInUser = { ...mockUser, wishlist: mockUser.wishlist || [] };
          persistUser(loggedInUser);
          resolve(loggedInUser);
        } else {
          reject(new Error("Invalid email or password"));
        }
      }, 800);
    });
  };

  const register = ({ name, companyName, email, password }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          id: Date.now(),
          name,
          companyName,
          email,
          wishlist: [],
        };
        persistUser(newUser);
        resolve(newUser);
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateProfile = (updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleWishlist = (propertyId) => {
    setUser((prev) => {
      if (!prev) return prev;
      const alreadySaved = prev.wishlist.includes(propertyId);
      const wishlist = alreadySaved
        ? prev.wishlist.filter((id) => id !== propertyId)
        : [...prev.wishlist, propertyId];
      const updated = { ...prev, wishlist };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
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