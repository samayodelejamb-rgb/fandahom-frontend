import { BedDouble, Bath, MapPin, ChevronRight } from "lucide-react";
import { formatPrice } from "../../../utils/mapHelpers";
import "../../../styles/map-theme.css";
import "./PropertyBottomCard.css";

export default function PropertyBottomCard({ property, onViewDetails }) {
  if (!property) return null;
  const p = property;

  return (
    <div className="re-pm-bottom-card">
      <div className="re-pm-bottom-card__inner">
        <div className="re-pm-bottom-card__media">
          <img src={p.image} alt={p.title} />
          <span className="re-pm-bottom-card__price">{formatPrice(p.price)}</span>
        </div>

        <div className="re-pm-bottom-card__info">
          <h4 className="re-pm-bottom-card__title">{p.title}</h4>
          <p className="re-pm-bottom-card__loc">
            <MapPin size={13} /> {p.location}
          </p>
          <div className="re-pm-bottom-card__stats">
            {p.bedrooms != null && <span><BedDouble size={14} /> {p.bedrooms}</span>}
            {p.bathrooms != null && <span><Bath size={14} /> {p.bathrooms}</span>}
          </div>
        </div>

        <button
          className="re-btn re-btn--primary re-pm-bottom-card__cta"
          type="button"
          onClick={() => onViewDetails?.(p)}
        >
          Details <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
