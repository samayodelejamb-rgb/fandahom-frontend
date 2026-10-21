import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  X,
  LocateFixed,
  LoaderCircle,
  CircleAlert,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import { fetchAllListings } from "../../services/listingApi";
import { toMapListings, isValidCoordinates, formatPrice } from "../../utils/mapHelpers";
import PropertyMap from "../../components/map/PropertyMap";
import "../../styles/map-theme.css";
import "./MapView.css";

const RADIUS_OPTIONS = [5, 10, 25, 50];
const DEFAULT_RADIUS = 10;

// "Max price" choices in naira. null = any price.
const PRICE_CEILINGS = [
  { value: null, label: "Any price" },
  { value: 5_000_000, label: formatPrice(5_000_000) },
  { value: 20_000_000, label: formatPrice(20_000_000) },
  { value: 50_000_000, label: formatPrice(50_000_000) },
  { value: 100_000_000, label: formatPrice(100_000_000) },
  { value: 250_000_000, label: formatPrice(250_000_000) },
  { value: 500_000_000, label: formatPrice(500_000_000) },
  { value: 1_000_000_000, label: formatPrice(1_000_000_000) },
];

export default function MapView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // /map?focus=12 opens the map with listing 12 selected (used by the
  // "View on Map" button on the property page).
  const focusId = Number(searchParams.get("focus")) || null;

  // Listings from the API (already converted for the map). null = not loaded yet.
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection + search/filter state.
  const [activeId, setActiveId] = useState(null);
  // The search box lives in the site's navbar. Searching there while on
  // /map puts the text in the URL (?search=...) and this page filters by it.
  const query = searchParams.get("search") || "";
  const clearQuery = () =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("search");
        return next;
      },
      { replace: true }
    );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(null);

  // Near-me / radius state.
  const [nearMe, setNearMe] = useState(false);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // The site's sticky navbar sits above this page, so measure it and give
  // the map exactly the remaining height.
  const [topOffset, setTopOffset] = useState(0);
  useEffect(() => {
    const measure = () =>
      setTopOffset(document.querySelector(".navbar-wrap")?.offsetHeight || 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Loads listings from the API (GET /listing/, all pages). Ignores the
  // result if a newer request has started since, so slow answers can't
  // overwrite fresher ones. Returns the converted listings, or null.
  const requestId = useRef(0);
  const loadListings = useCallback(async (params = {}) => {
    const thisRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllListings(params);
      if (thisRequest !== requestId.current) return null;
      const mapped = toMapListings(data.listings);
      setListings(mapped);
      return mapped;
    } catch (err) {
      if (thisRequest === requestId.current) {
        setError(err.message || "Could not load listings.");
      }
      return null;
    } finally {
      if (thisRequest === requestId.current) setLoading(false);
    }
  }, []);

  // Everything the user can filter by is sent to the API with the doc's own
  // query parameters: q, max_price, and lat + lng + radius_km together.
  const apiParams = useMemo(() => {
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (maxPrice !== null) params.max_price = maxPrice;
    if (nearMe && userLocation) {
      params.lat = userLocation.lat;
      params.lng = userLocation.lng;
      params.radius_km = radius;
    }
    return params;
  }, [query, maxPrice, nearMe, userLocation, radius]);

  // (Re)load whenever any of those change.
  const firstLoadDone = useRef(false);
  useEffect(() => {
    loadListings(apiParams).then((mapped) => {
      if (!mapped) return;

      // Keep the current selection if it's still in the results. The very
      // first time, prefer the ?focus listing. Otherwise pick the first
      // listing that has map coordinates.
      const preferId = firstLoadDone.current ? null : focusId;
      firstLoadDone.current = true;
      setActiveId((current) => {
        if (current && mapped.some((p) => p.id === current)) return current;
        const preferred = preferId && mapped.find((p) => p.id === preferId);
        const firstMappable = mapped.find((p) => isValidCoordinates(p.lat, p.lng));
        return preferred?.id ?? firstMappable?.id ?? mapped[0]?.id ?? null;
      });

      if (apiParams.radius_km) {
        setGeoError(
          mapped.length === 0
            ? `No listings found within ${apiParams.radius_km} km of your location.`
            : null
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focusId only matters for the first load
  }, [apiParams, loadListings]);

  // The API already applied every filter, so these are the results.
  const filtered = listings ?? [];
  const selected = filtered.find((p) => p.id === activeId) || filtered[0] || null;

  // ---------- Near me / proximity search ----------
  // Uses the API's documented lat, lng and radius_km parameters.

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coords);
        setNearMe(true);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setNearMe(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Enable location access to search nearby.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError("Your location is currently unavailable.");
        } else if (err.code === err.TIMEOUT) {
          setGeoError("Timed out while getting your location.");
        } else {
          setGeoError("Could not determine your location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Changing the radius while "Near me" is on re-searches automatically
  // (see apiParams above); the location we already have is reused.
  const handleRadiusChange = (newRadius) => setRadius(newRadius);

  const clearNearMe = () => {
    setNearMe(false);
    setUserLocation(null);
    setGeoError(null);
    setRadius(DEFAULT_RADIUS);
  };

  const resetFilters = () => {
    clearQuery();
    setMaxPrice(null);
  };

  return (
    <div
      className="re-page re-mapview"
      style={{ "--re-top-offset": `${topOffset}px` }}
    >
      {/* Top bar */}
      <header className="re-mapview__topbar">
        <Link to="/" className="re-btn re-btn--ghost re-mapview__back">
          <ArrowLeft size={18} />
          <span>Back to Listings</span>
        </Link>

        <button
          className={`re-btn re-btn--ghost re-mapview__filter ${filtersOpen ? "re-mapview__filter--open" : ""}`}
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontal size={18} />
          <span>Filters</span>
        </button>
      </header>

      {/* Shows what the navbar search is currently filtering by */}
      {query && (
        <div className="re-mapview__chiprow">
          <span className="re-mapview__chip">
            Showing results for &ldquo;{query}&rdquo;
            <button
              type="button"
              className="re-mapview__chip-clear"
              aria-label="Clear search"
              onClick={clearQuery}
            >
              <X size={14} />
            </button>
          </span>
        </div>
      )}

      {/* Near-me control row */}
      <div className="re-mapview__nearme">
        <button
          className={`re-btn re-btn--ghost re-mapview__nearme-btn ${nearMe ? "re-mapview__nearme-btn--active" : ""}`}
          type="button"
          onClick={nearMe ? clearNearMe : handleNearMe}
          disabled={geoLoading}
        >
          {geoLoading ? (
            <LoaderCircle size={16} className="re-mapview__spin" />
          ) : (
            <LocateFixed size={16} />
          )}
          {nearMe ? "Clear Near Me" : "Search Near Me"}
        </button>

        <div className="re-mapview__radius">
          <span className="re-mapview__radius-label">Radius:</span>
          <div className="re-mapview__radius-options">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`re-mapview__radius-chip ${radius === r ? "re-mapview__radius-chip--active" : ""}`}
                onClick={() => handleRadiusChange(r)}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Geolocation message banner */}
      {geoError && (
        <div className="re-mapview__banner re-mapview__banner--warn">
          <CircleAlert size={16} />
          <span>{geoError}</span>
          <button
            type="button"
            className="re-mapview__banner-close"
            aria-label="Dismiss"
            onClick={() => setGeoError(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* API error banner */}
      {error && (
        <div className="re-mapview__banner re-mapview__banner--error">
          <CircleAlert size={16} />
          <span>{error}</span>
          <button
            type="button"
            className="re-mapview__banner-close"
            aria-label="Dismiss"
            onClick={() => setError(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter panel */}
      {filtersOpen && (
        <div className="re-mapview__filters">
          <div className="re-mapview__filter-row">
            <label htmlFor="pf-price">Max Price</label>
            <select
              id="pf-price"
              className="re-mapview__select"
              value={maxPrice === null ? "" : String(maxPrice)}
              onChange={(e) => setMaxPrice(e.target.value === "" ? null : Number(e.target.value))}
            >
              {PRICE_CEILINGS.map((c) => (
                <option key={c.label} value={c.value === null ? "" : String(c.value)}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="re-btn re-btn--ghost re-mapview__filter-reset"
            type="button"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      )}

      {/* Map */}
      <div className="re-mapview__body">
        <div className="re-mapview__map">
          {loading && listings === null ? (
            <div className="re-mapview__loading">
              <LoaderCircle size={28} className="re-mapview__spin" />
              <p>Loading listings…</p>
            </div>
          ) : filtered.length > 0 ? (
            <PropertyMap
              properties={filtered}
              selectedId={selected?.id}
              onSelect={setActiveId}
              userLocation={userLocation}
              onViewDetails={(p) => navigate(`/property/${p.id}`)}
            />
          ) : (
            <div className="re-mapview__empty">
              <Search size={28} />
              <h3>No properties found</h3>
              <p>Try adjusting your search or filters.</p>
              <button
                className="re-btn re-btn--primary"
                type="button"
                onClick={() => {
                  resetFilters();
                  if (nearMe) clearNearMe();
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
