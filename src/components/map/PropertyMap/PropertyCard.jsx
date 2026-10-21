import { BedDouble, Bath, MapPin, ChevronRight, Heart } from "lucide-react";
import { formatPrice } from "../../../utils/mapHelpers";
import "../../../styles/map-theme.css";
import "./PropertyCard.css";

export default function PropertyCard({ property, onViewDetails, onToggleFav, favorite }) {
  if (!property) return null;
  const p = property;

  return (
    <div className="re-pm-card">
      <div className="re-pm-card__media">
        <img src={p.image} alt={p.title} />
        {onToggleFav && (
          <button
            type="button"
            className="re-pm-card__fav"
            aria-label="Save property"
            onClick={() => onToggleFav(p.id)}
          >
            <Heart size={18} fill={favorite ? "currentColor" : "none"} />
          </button>
        )}
        <span className="re-pm-card__price">{formatPrice(p.price)}</span>
      </div>

      <div className="re-pm-card__body">
        <h3 className="re-pm-card__title">{p.title}</h3>
        <p className="re-pm-card__loc">
          <MapPin size={15} /> {p.location}
        </p>

        <div className="re-pm-card__stats">
          {p.bedrooms != null && <span><BedDouble size={16} /> {p.bedrooms} Beds</span>}
          {p.bathrooms != null && <span><Bath size={16} /> {p.bathrooms} Baths</span>}
        </div>

        <button
          className="re-btn re-btn--primary re-pm-card__cta"
          type="button"
          onClick={() => onViewDetails?.(p)}
        >
          View Property Details <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
