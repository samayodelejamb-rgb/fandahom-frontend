import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Heart, CircleUserRound, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(searchValue)}`);
  };

  const handleHeartClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      navigate("/login");
    }
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar__logo">
        <Home size={22} strokeWidth={2} />
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

      <div className="navbar__actions">
        <Link to="/wishlist" onClick={handleHeartClick} className="navbar__icon-link">
          <Heart size={24} strokeWidth={1.5} />
        </Link>

        <Link to={isAuthenticated ? "/profile" : "/login"} className="navbar__icon-link">
          <CircleUserRound size={28} strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  );
}

export default Navbar;