import { getCoverImage } from "./listingImages";

// Default map centre when there's nothing to centre on: Lagos.
export const DEFAULT_MAP_CENTER = [6.5244, 3.3792];

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Coordinates are valid only if both are real numbers in range. */
export const isValidCoordinates = (latitude, longitude) => {
  const lat = toNumberOrNull(latitude);
  const lng = toNumberOrNull(longitude);
  return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

/** Safe number from a listing coordinate field (null if missing/invalid). */
export const coordinateOrNull = toNumberOrNull;

/** Full price, e.g. ₦120,000,000 */
export const formatPrice = (value) => "₦" + Number(value || 0).toLocaleString();

/** Short price for map pins, e.g. ₦120M, ₦4.5M, ₦700k */
export const formatPriceCompact = (value) => {
  const n = Number(value || 0);
  const trim = (x) => String(Math.round(x * 10) / 10);
  if (n >= 1_000_000_000) return `₦${trim(n / 1_000_000_000)}B`;
  if (n >= 1_000_000) return `₦${trim(n / 1_000_000)}M`;
  if (n >= 1_000) return `₦${trim(n / 1_000)}k`;
  return `₦${n}`;
};

/**
 * Turn a real API listing (fields from the API doc: id, title, address,
 * price, bedrooms, bathrooms, latitude, longitude...) into the shape the
 * map components use. The API has no "size" field, so none is shown.
 */
export function toMapListing(listing) {
  const latitude = toNumberOrNull(listing.latitude);
  const longitude = toNumberOrNull(listing.longitude);
  const hasCoordinates = isValidCoordinates(latitude, longitude);

  return {
    id: listing.id,
    title: listing.title || "Untitled listing",
    location: listing.address || "",
    price: Number(listing.price || 0),
    latitude: hasCoordinates ? latitude : null,
    longitude: hasCoordinates ? longitude : null,
    // lat/lng aliases used by the Leaflet code
    lat: hasCoordinates ? latitude : null,
    lng: hasCoordinates ? longitude : null,
    bedrooms: listing.bedrooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    image: getCoverImage(listing),
    hasCoordinates,
  };
}

export const toMapListings = (list) =>
  Array.isArray(list) ? list.map(toMapListing) : [];
