import { apiRequest } from "./apiClient";

/**
 * Browse/search listings. Supports the backend's documented query params:
 * q, type, tag, min_price, max_price, bedrooms, bathrooms, swimming_pool,
 * lat, lng, radius_km, page, limit.
 * Pass any subset as an object — only defined values are sent.
 */
export async function fetchListings(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  const data = await apiRequest(`/listing/${qs ? `?${qs}` : ""}`);
  return data; // { listings, meta }
}

/**
 * Create a new listing. Caller must be authenticated.
 * Required: title, price, address, type (1=Rent, 2=Sale).
 * Optional: description, tag, bedrooms, bathrooms, swimming_pool,
 * latitude, longitude.
 */
export async function createListing(payload) {
  const data = await apiRequest("/listing/", {
    method: "POST",
    body: payload,
  });
  return data.listing;
}

/**
 * Get a single listing by id.
 */
export async function fetchListing(id) {
  const data = await apiRequest(`/listing/${id}/`);
  return data.listing;
}

/**
 * Update an existing listing. Caller must be the owner or staff.
 *
 * NOTE: this endpoint (PATCH /listing/<id>/) is not documented in the
 * backend API doc we were given — only create/get/delete/list are shown.
 * Built against an assumed shape (same payload as create); confirm the
 * real method/path with backend dev before going live.
 */
export async function updateListing(id, payload) {
  const data = await apiRequest(`/listing/${id}/`, {
    method: "PATCH",
    body: payload,
  });
  return data.listing;
}

/**
 * Soft-delete a listing. Caller must be the owner or staff.
 */
export async function deleteListing(id) {
  await apiRequest(`/listing/${id}/`, { method: "DELETE" });
}


/**
 * Listings owned by the currently authenticated user.
 * Supports the same filter params as fetchListings.
 */
export async function fetchMyListings(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const qs = query.toString();
  const data = await apiRequest(`/listing/mine/${qs ? `?${qs}` : ""}`);
  return data; // { listings, meta }
}