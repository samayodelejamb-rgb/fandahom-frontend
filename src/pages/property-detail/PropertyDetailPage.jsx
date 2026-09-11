import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  MapPinned,
  MessageCircle,
  Calendar,
  Tag,
} from "lucide-react";
import { fetchListing, fetchListings } from "../../services/listingApi";
import PropertyCard from "../../components/property/PropertyCard";
import "./PropertyDetailPage.css";

const TYPE_LABELS = { 1: "For Rent", 2: "For Sale" };
const TAG_LABELS = { 1: "New", 2: "Hot", 3: "Featured" };

// Demo-only stock photo, assigned deterministically per listing id.
// NOT the listing's real photo — real media requires the
// /media/init -> S3 -> /media/confirm flow, which isn't built yet.
const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
];

function getDemoPhoto(id) {
  return DEMO_PHOTOS[id % DEMO_PHOTOS.length];
}

function PropertyDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [similarListings, setSimilarListings] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchListing(id);
        if (!cancelled) setListing(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load "Similar Listings" — same type (Rent/Sale) as the current
  // listing, excluding itself. Runs after the main listing is known.
  useEffect(() => {
    if (!listing) return;
    let cancelled = false;

    async function loadSimilar() {
      try {
        const data = await fetchListings({ type: listing.type, limit: 5 });
        if (!cancelled) {
          setSimilarListings(data.listings.filter((l) => l.id !== listing.id).slice(0, 4));
        }
      } catch {
        // Non-critical section — fail quietly rather than blocking the page.
        if (!cancelled) setSimilarListings([]);
      }
    }

    loadSimilar();
    return () => {
      cancelled = true;
    };
  }, [listing]);

  if (loading) {
    return <p style={{ padding: "3rem", textAlign: "center" }}>Loading listing...</p>;
  }

  if (error || !listing) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p>{error || "Listing not found."}</p>
        <Link to="/">Back to Listings</Link>
      </div>
    );
  }

  return (
    <div className="pd-page">
      <Link to="/" className="pd-page__back">
        <ArrowLeft size={16} /> Back to Listings
      </Link>

      <div className="pd-page__layout">
        <div className="pd-page__left">
          {/* Media upload isn't wired up yet — this is a deterministic
              demo photo, not the listing's real photo. Will be replaced
              once the /media/init -> S3 -> /media/confirm flow is built. */}
          <div className="pd-gallery">
            <div className="pd-gallery__main">
              <img src={getDemoPhoto(listing.id)} alt={listing.title} />
            </div>
          </div>

          {/* Property Details — only fields that actually exist on the
              real Listing object */}
          <div className="pd-panel pd-details-panel">
            <h3 className="pd-panel__title">Property Details</h3>
            <div className="pd-details-grid">
              <div className="pd-detail-item">
                <p className="pd-detail-item__label">Listing Type</p>
                <p className="pd-detail-item__value">{TYPE_LABELS[listing.type] || "—"}</p>
              </div>
              {listing.tag && (
                <div className="pd-detail-item">
                  <p className="pd-detail-item__label">Tag</p>
                  <p className="pd-detail-item__value">{TAG_LABELS[listing.tag]}</p>
                </div>
              )}
              <div className="pd-detail-item">
                <p className="pd-detail-item__label">Swimming Pool</p>
                <p className="pd-detail-item__value">{listing.swimming_pool ? "Yes" : "No"}</p>
              </div>
              {listing.created_at && (
                <div className="pd-detail-item">
                  <p className="pd-detail-item__label">Listed On</p>
                  <p className="pd-detail-item__value">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="pd-panel pd-location-panel">
            <h3 className="pd-panel__title">Location</h3>
            <div className="pd-map-placeholder">Map view coming soon</div>
            <p style={{ fontWeight: 600, margin: 0 }}>{listing.address}</p>
          </div>
        </div>

        <div className="pd-page__right">
          {/* Info + actions */}
          <div className="pd-panel pd-info-panel">
            <span className="pd-info__tag">{TYPE_LABELS[listing.type] || "Listing"}</span>
            {listing.tag && (
              <span className="pd-info__tag pd-info__tag--secondary">
                <Tag size={12} /> {TAG_LABELS[listing.tag]}
              </span>
            )}
            <h1 className="pd-info__title">{listing.title}</h1>
            <p className="pd-info__location">
              <MapPin size={16} /> {listing.address}
            </p>
            <p className="pd-info__price">₦{listing.price.toLocaleString()}</p>

            <div className="pd-info__stats">
              {listing.bedrooms != null && (
                <span className="pd-info__stat"><BedDouble size={16} /> {listing.bedrooms} Beds</span>
              )}
              {listing.bathrooms != null && (
                <span className="pd-info__stat"><Bath size={16} /> {listing.bathrooms} Baths</span>
              )}
              {listing.created_at && (
                <span className="pd-info__stat"><Calendar size={16} /> {new Date(listing.created_at).toLocaleDateString()}</span>
              )}
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

          {/* Description */}
          {listing.description && (
            <div className="pd-panel pd-description-panel">
              <h3 className="pd-panel__title">Description</h3>
              <p className="pd-description">{listing.description}</p>
            </div>
          )}
        </div>
      </div>

      {similarListings.length > 0 && (
        <div className="pd-similar">
          <h3 className="pd-similar__title">Similar Listings</h3>
          <div className="pd-similar__grid">
            {similarListings.map((item) => (
              <PropertyCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetailPage;
