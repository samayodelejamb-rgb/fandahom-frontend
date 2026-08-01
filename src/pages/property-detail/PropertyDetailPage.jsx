import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  MessageCircle,
  Phone,
  CheckCircle2,
  Home,
  Sofa,
  Calendar,
  ClipboardList,
  BadgeCheck,
} from "lucide-react";
import { mockProperties } from "../../mocks/mockProperties";
import "./PropertyDetailPage.css";

const DETAIL_ICON_MAP = {
  propertyType: Home,
  size: Ruler,
  tenure: ClipboardList,
  status: BadgeCheck,
  furnished: Sofa,
  yearBuilt: Calendar,
};

const DETAIL_LABELS = {
  propertyType: "Property Type",
  size: "Property Size",
  tenure: "Tenure",
  status: "Status",
  furnished: "Furnished",
  yearBuilt: "Year Built",
};

function PropertyDetailPage() {
  const { id } = useParams();
  const property = mockProperties.find((p) => p.id === Number(id));
  const [activeIndex, setActiveIndex] = useState(0);

  if (!property) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p>Property not found.</p>
        <Link to="/">Back to Listings</Link>
      </div>
    );
  }

  const media = [
    ...property.images.map((src) => ({ type: "image", src })),
    ...(property.videos || []).map((src) => ({ type: "video", src })),
  ];

  const MAX_VISIBLE_THUMBS = 5;
  const visibleThumbs = media.slice(0, MAX_VISIBLE_THUMBS);
  const remainingCount = media.length - MAX_VISIBLE_THUMBS;

  const goPrev = () => setActiveIndex((i) => (i === 0 ? media.length - 1 : i - 1));
  const goNext = () => setActiveIndex((i) => (i === media.length - 1 ? 0 : i + 1));

  const activeMedia = media[activeIndex];

  return (
    <div className="pd-page">
      <Link to="/" className="pd-page__back">
        <ArrowLeft size={16} /> Back to Listings
      </Link>

      <div className="pd-page__layout">
        <div className="pd-page__left">
          {/* Gallery */}
          <div className="pd-gallery">
            <div className="pd-gallery__main">
              {activeMedia.type === "video" ? (
                <video src={activeMedia.src} controls />
              ) : (
                <img src={activeMedia.src} alt={property.title} />
              )}
              <span className="pd-gallery__counter">{activeIndex + 1} / {media.length}</span>
              {media.length > 1 && (
                <>
                  <button className="pd-gallery__nav-btn pd-gallery__nav-btn--prev" onClick={goPrev} aria-label="Previous">
                    <ChevronLeft size={18} />
                  </button>
                  <button className="pd-gallery__nav-btn pd-gallery__nav-btn--next" onClick={goNext} aria-label="Next">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {media.length > 1 && (
              <div className="pd-gallery__thumbs">
                {visibleThumbs.map((item, index) => {
                  const isLastVisible = index === MAX_VISIBLE_THUMBS - 1 && remainingCount > 0;
                  return (
                    <div
                      key={index}
                      className={`pd-gallery__thumb ${activeIndex === index ? "pd-gallery__thumb--active" : ""}`}
                      onClick={() => setActiveIndex(index)}
                    >
                      {item.type === "video" ? (
                        <video src={item.src} muted />
                      ) : (
                        <img src={item.src} alt={`${property.title} ${index + 1}`} />
                      )}
                      {isLastVisible && (
                        <div className="pd-gallery__thumb-overlay">+{remainingCount}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="pd-panel pd-details-panel">
            <h3 className="pd-panel__title">Property Details</h3>
            <div className="pd-details-grid">
              {Object.entries(property.details).map(([key, value]) => {
                if (key === "bedrooms" || key === "bathrooms") return null;
                const Icon = DETAIL_ICON_MAP[key] || Home;
                const label = DETAIL_LABELS[key] || key;
                return (
                  <div className="pd-detail-item" key={key}>
                    <span className="pd-detail-item__icon">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="pd-detail-item__label">{label}</p>
                      <p className="pd-detail-item__value">{value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Amenities */}
          <div className="pd-panel pd-amenities-panel">
            <h3 className="pd-panel__title">Features & Amenities</h3>
            <div className="pd-amenities">
              {property.amenities.map((item) => (
                <span key={item} className="pd-amenity-tag">
                  <CheckCircle2 size={14} /> {item}
                </span>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="pd-panel pd-location-panel">
            <h3 className="pd-panel__title">Location</h3>
            <div className="pd-map-placeholder">Map view coming soon</div>
            <p style={{ fontWeight: 600, margin: "0 0 0.25rem 0" }}>{property.location_map.address}</p>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: 0 }}>
              {property.location_map.note}
            </p>
          </div>

          {/* Nearby Places */}
          <div className="pd-panel pd-nearby-panel">
            <h3 className="pd-panel__title">Nearby Places</h3>
            <div className="pd-nearby-grid">
              {property.nearbyPlaces.map((place) => (
                <div className="pd-nearby-item" key={place.name}>
                  <span className="pd-nearby-item__icon">
                    <MapPinned size={16} />
                  </span>
                  <div>
                    <p className="pd-nearby-item__name">{place.name}</p>
                    <p className="pd-nearby-item__distance">{place.distance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pd-page__right">
          {/* Info + actions */}
          <div className="pd-panel pd-info-panel">
            <span className="pd-info__tag">{property.status}</span>
            <h1 className="pd-info__title">{property.title}</h1>
            <p className="pd-info__location">
              <MapPin size={16} /> {property.location}
            </p>
            <p className="pd-info__price">₦{property.price.toLocaleString()}</p>

            <div className="pd-info__stats">
              <span className="pd-info__stat"><BedDouble size={16} /> {property.beds} Beds</span>
              <span className="pd-info__stat"><Bath size={16} /> {property.baths} Baths</span>
              <span className="pd-info__stat"><Ruler size={16} /> {property.sqm} sqm</span>
            </div>

            <div className="pd-info__actions">
              <button className="pd-btn pd-btn--outline">
                <MapPinned size={16} /> View on Map
              </button>
              <button className="pd-btn pd-btn--primary">
                <MessageCircle size={16} /> Make Enquiry
              </button>
            </div>
          </div>

          {/* Agent */}
          <div className="pd-panel pd-agent-panel">
            <h3 className="pd-panel__title">Listed by</h3>
            <div className="pd-agent__row">
              <img src={property.agent.photo} alt={property.agent.name} className="pd-agent__avatar" />
              <div>
                <p className="pd-agent__name">{property.agent.name}</p>
                <p className="pd-agent__role">{property.agent.role}</p>
                {property.agent.verified && (
                  <span className="pd-agent__verified">
                    <BadgeCheck size={14} /> Verified Agent
                  </span>
                )}
              </div>
            </div>

            <p className="pd-agent__contact">
              <Phone size={14} /> {property.agent.phone}
            </p>
            <p className="pd-agent__contact">{property.agent.email}</p>

            <div className="pd-agent__actions">
              <button className="pd-btn pd-btn--outline">
                <Phone size={16} /> Call Agent
              </button>
              <button className="pd-btn pd-btn--primary">
                <MessageCircle size={16} /> WhatsApp
              </button>
            </div>
          </div>

          {/* Description — its own panel so we can position it independently on mobile */}
          <div className="pd-panel pd-description-panel">
            <h3 className="pd-panel__title">Description</h3>
            <p className="pd-description">{property.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailPage;