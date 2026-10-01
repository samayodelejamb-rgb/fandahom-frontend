import { Link, useNavigate } from "react-router-dom";
import { Heart, MapPin, BedDouble, Bath } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getCoverImage } from "../../utils/listingImages";
import "./PropertyCard.css";

const TYPE_LABELS = { 1: "For Rent", 2: "For Sale" };
const TAG_LABELS = { 1: "New", 2: "Hot", 3: "Featured" };

function PropertyCard({ listing }) {
  const { isAuthenticated, wishlist, toggleWishlist } = useAuth();
  const navigate = useNavigate();
  const isSaved = wishlist?.includes(listing.id);

  const handleHeartClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      // Carry which property they were trying to save, so after they
      // sign in/register we can save it automatically and drop them
      // straight on that listing instead of a generic page.
      navigate("/login", { state: { pendingWishlistId: listing.id } });
      return;
    }
    toggleWishlist(listing.id);
  };

  return (
    <Link to={`/property/${listing.id}`} className="property-card">
      <div className="property-card__image-wrapper">
        <img
          src={getCoverImage(listing)}
          alt={listing.title}
          className="property-card__image"
        />

        <span className="property-card__tag">{TYPE_LABELS[listing.type] || "Listing"}</span>
        {listing.tag && (
          <span className="property-card__tag property-card__tag--secondary">
            {TAG_LABELS[listing.tag]}
          </span>
        )}
        <button className="property-card__heart" onClick={handleHeartClick}>
          <Heart size={16} fill={isSaved ? "#dc2626" : "none"} color={isSaved ? "#dc2626" : "#333"} />
        </button>
      </div>

      <div className="property-card__body">
        <h4 className="property-card__title">{listing.title}</h4>
        <p className="property-card__location">
          <MapPin size={14} /> {listing.address}
        </p>
        <p className="property-card__price">₦{listing.price.toLocaleString()}</p>

        <div className="property-card__stats">
          {listing.bedrooms != null && (
            <span className="property-card__stat"><BedDouble size={14} /> {listing.bedrooms} Beds</span>
          )}
          {listing.bathrooms != null && (
            <span className="property-card__stat"><Bath size={14} /> {listing.bathrooms} Baths</span>
          )}
          {listing.swimming_pool && (
            <span className="property-card__stat">Pool</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default PropertyCard;
