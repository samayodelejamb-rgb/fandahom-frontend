import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Heart,
  CircleUserRound,
  Search,
  MapPinned,
  Mail,
  LogIn,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");
  // The mobile menu is "open" only for the page it was opened on, so it
  // closes by itself as soon as the user navigates anywhere.
  const [menuOpenAt, setMenuOpenAt] = useState(null);
  const menuOpen = menuOpenAt === location.pathname;
  const menuRef = useRef(null);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // On the map page this search filters the map; everywhere else it
    // opens the listings page with the search applied.
    const base = location.pathname === "/map" ? "/map" : "/";
    navigate(`${base}?search=${encodeURIComponent(searchValue)}`);
  };

  // Wishlist needs an account: logged-out users go to login instead.
  const handleWishlistClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate("/login");
    }
  };

  // Mobile menu: also close on Escape and on a tap outside it.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const handlePointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenAt(null);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpenAt(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="navbar-wrap">
      <header className="navbar">
        <Link to="/" className="navbar__logo" aria-label="Fandahom home">
          <span className="navbar__logo-icon">
            <Home size={18} strokeWidth={2.2} />
          </span>
          <span>Fandahom</span>
        </Link>

        <form className="navbar__search-wrapper" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by location, property name..."
            className="navbar__search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button type="submit" className="navbar__search-btn" aria-label="Search">
            <Search size={18} />
          </button>
        </form>

        {/* Desktop / tablet: all icons on the bar */}
        <div className="navbar__actions navbar__actions--desktop">
          <Link to="/map" className="navbar__icon-link" aria-label="Map view">
            <MapPinned size={24} strokeWidth={1.5} />
          </Link>
          <Link to="/contact" className="navbar__icon-link" aria-label="Contact us" title="Contact us">
            <Mail size={22} strokeWidth={1.5} />
          </Link>
          <Link to="/wishlist" onClick={handleWishlistClick} className="navbar__icon-link" aria-label="Wishlist">
            <Heart size={22} strokeWidth={1.5} />
          </Link>

          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            className="navbar__icon-link"
            aria-label={isAuthenticated ? "My profile" : "Log in"}
          >
            <CircleUserRound size={24} strokeWidth={1.5} />
          </Link>
        </div>

        {/* Mobile: only the profile icon, which opens a menu with the rest */}
        <div className="navbar__mobile" ref={menuRef}>
          <button
            type="button"
            className="navbar__icon-link navbar__mobile-btn"
            aria-label="Menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpenAt(menuOpen ? null : location.pathname)}
          >
            <CircleUserRound size={24} strokeWidth={1.5} />
          </button>

          {menuOpen && (
            <nav className="navbar__menu" role="menu" aria-label="Account and pages">
              {isAuthenticated ? (
                <Link to="/profile" className="navbar__menu-item" role="menuitem">
                  <CircleUserRound size={18} strokeWidth={1.75} /> My profile
                </Link>
              ) : (
                <Link to="/login" className="navbar__menu-item" role="menuitem">
                  <LogIn size={18} strokeWidth={1.75} /> Log in
                </Link>
              )}
              <Link
                to="/wishlist"
                onClick={handleWishlistClick}
                className="navbar__menu-item"
                role="menuitem"
              >
                <Heart size={18} strokeWidth={1.75} /> Wishlist
              </Link>
              <Link to="/map" className="navbar__menu-item" role="menuitem">
                <MapPinned size={18} strokeWidth={1.75} /> Map view
              </Link>
              <Link to="/contact" className="navbar__menu-item" role="menuitem">
                <Mail size={18} strokeWidth={1.75} /> Contact us
              </Link>
            </nav>
          )}
        </div>
      </header>
    </div>
  );
}

export default Navbar;
