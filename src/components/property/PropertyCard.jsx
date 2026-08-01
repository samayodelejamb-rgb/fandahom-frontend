import { Link } from "react-router-dom";
import { Heart, MapPin, BedDouble, Bath, Ruler } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./PropertyCard.css";

function PropertyCard({ property }) {
  const { isAuthenticated, user, toggleWishlist } = useAuth();
  const isSaved = user?.wishlist?.includes(property.id);

  const handleHeartClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    toggleWishlist(property.id);
  };

  return (
    <Link to={`/property/${property.id}`} className="property-card">
      <div className="property-card__image-wrapper">
        <img
          src={property.images[0]}
          alt={property.title}
          className="property-card__image"
        />
        <span className="property-card__tag">{property.status}</span>
        <button className="property-card__heart" onClick={handleHeartClick}>
          <Heart size={16} fill={isSaved ? "#dc2626" : "none"} color={isSaved ? "#dc2626" : "#333"} />
        </button>
      </div>

      <div className="property-card__body">
        <h4 className="property-card__title">{property.title}</h4>
        <p className="property-card__location">
          <MapPin size={14} /> {property.location}
        </p>
        <p className="property-card__price">₦{property.price.toLocaleString()}</p>

        <div className="property-card__stats">
          <span className="property-card__stat"><BedDouble size={14} /> {property.beds} Beds</span>
          <span className="property-card__stat"><Bath size={14} /> {property.baths} Baths</span>
          <span className="property-card__stat"><Ruler size={14} /> {property.sqm} sqm</span>
        </div>
      </div>
    </Link>
  );
}

export default PropertyCard;