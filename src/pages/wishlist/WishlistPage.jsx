import { Link } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { mockProperties } from "../../mocks/mockProperties";
import "./WishlistPage.css";

function WishlistPage() {
  const { user, toggleWishlist } = useAuth();

  if (!user) {
    return <p style={{ padding: "2rem" }}>You need to log in to view your wishlist.</p>;
  }

  const wishlistProperties = mockProperties.filter((p) =>
    user.wishlist?.includes(p.id)
  );

  return (
    <div className="wishlist-page">
      <Link to="/profile" className="wishlist-page__back">
        <ArrowLeft size={16} /> Back to Profile
      </Link>

      <h2 className="wishlist-page__title">
        <Heart size={22} /> My Wishlist
      </h2>

      {wishlistProperties.length === 0 ? (
        <p className="wishlist-page__empty">No saved properties yet.</p>
      ) : (
        <div className="wishlist-page__list">
          {wishlistProperties.map((property) => (
            <div key={property.id} className="wishlist-page__item">
              <div>
                <p className="wishlist-page__item-title">{property.title}</p>
                <p className="wishlist-page__item-location">{property.location}</p>
                <p className="wishlist-page__item-price">₦{property.price.toLocaleString()}</p>
              </div>
              <button
                onClick={() => toggleWishlist(property.id)}
                className="wishlist-page__remove-btn"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WishlistPage;