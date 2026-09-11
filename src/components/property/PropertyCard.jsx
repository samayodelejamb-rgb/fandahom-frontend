import { Link } from "react-router-dom";
import { Heart, MapPin, BedDouble, Bath } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./PropertyCard.css";

const TYPE_LABELS = { 1: "For Rent", 2: "For Sale" };
const TAG_LABELS = { 1: "New", 2: "Hot", 3: "Featured" };

// Demo-only stock photos, assigned deterministically per listing id.
// These are NOT the listing's real photos — real per-listing media
// requires the /media/init -> S3 -> /media/confirm flow, which isn't
// built yet. Swap this out once that exists.
const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
];

function getDemoPhoto(id) {
  return DEMO_PHOTOS[id % DEMO_PHOTOS.length];
}

function PropertyCard({ listing }) {
  const { isAuthenticated, wishlist, toggleWishlist } = useAuth();
  const isSaved = wishlist?.includes(listing.id);

  const handleHeartClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    toggleWishlist(listing.id);
  };

  return (
    <Link to={`/property/${listing.id}`} className="property-card">
      <div className="property-card__image-wrapper">
        <img
          src={getDemoPhoto(listing.id)}
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
