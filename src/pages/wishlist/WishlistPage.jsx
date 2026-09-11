import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchListings } from "../../services/listingApi";
import PropertyCard from "../../components/property/PropertyCard";
import "./WishlistPage.css";

function WishlistPage() {
  const { user, wishlist } = useAuth();
  const [wishlistListings, setWishlistListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    loadWishlistListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, wishlist]);

  // NOTE: the backend API has no "fetch listings by a list of ids"
  // endpoint, so this pulls a page of listings and filters client-side.
  // Fine for a small catalogue; worth asking backend dev for a bulk
  // lookup endpoint (e.g. ?ids=1,2,3) once the catalogue grows.
  const loadWishlistListings = async () => {
    if (!wishlist || wishlist.length === 0) {
      setWishlistListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchListings({ limit: 100 });
      setWishlistListings(data.listings.filter((l) => wishlist.includes(l.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p style={{ padding: "2rem" }}>You need to log in to view your wishlist.</p>;
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-page__header">
        <Link to="/profile" className="wishlist-page__back">
          <ArrowLeft size={16} /> Back to Profile
        </Link>

        <div className="wishlist-page__heading-row">
          <span className="wishlist-page__icon-badge">
            <Heart size={20} />
          </span>
          <div>
            <h1 className="wishlist-page__title">My Wishlist</h1>
            <p className="wishlist-page__subtitle">
              {wishlistListings.length > 0
                ? `${wishlistListings.length} saved ${wishlistListings.length === 1 ? "property" : "properties"}`
                : "Properties you save will show up here"}
            </p>
          </div>
        </div>
      </div>

      {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

      {loading ? (
        <p className="wishlist-page__empty">Loading your wishlist...</p>
      ) : wishlistListings.length === 0 ? (
        <div className="wishlist-page__empty-state">
          <Heart size={40} strokeWidth={1.2} />
          <p>No saved properties yet.</p>
          <Link to="/" className="wishlist-page__browse-btn">Browse Listings</Link>
        </div>
      ) : (
        <div className="wishlist-page__grid">
          {wishlistListings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;
