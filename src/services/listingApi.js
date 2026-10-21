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


/**
 * GET /listing/<id>/media/ — every media item (images + videos) attached
 * to a listing. The owner sees items in ANY state (so the upload page can
 * show per-file processing progress); everyone else sees only "ready" ones.
 * Non-ready items have url: null.
 */
export async function fetchListingMedia(id) {
  const data = await apiRequest(`/listing/${id}/media/`);
  return data.media; // array
}

// ---------------------------------------------------------------------
// Fetch ALL pages (per the doc: `page`, `limit` max 100, and `meta.total_pages`)
// ---------------------------------------------------------------------
// The doc has no sort parameter, and the app sorts (newest / price) in the
// browser. Sorting only works if we have the whole result set, so these
// helpers read page 1, then fetch the remaining pages the doc's `meta`
// says exist. MAX_PAGES is a safety cap (10 pages = 1000 listings).
const PAGE_LIMIT = 100; // the doc's maximum per request
const MAX_PAGES = 10;

async function collectAllPages(fetchPage, params) {
  const first = await fetchPage({ ...params, limit: PAGE_LIMIT, page: 1 });
  const listings = [...first.listings];

  const totalPages = Math.min(first.meta?.total_pages ?? 1, MAX_PAGES);
  if (totalPages > 1) {
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        fetchPage({ ...params, limit: PAGE_LIMIT, page: i + 2 })
      )
    );
    rest.forEach((r) => listings.push(...r.listings));
  }

  // meta.total is still the server's real total, so the UI can tell the
  // user when the safety cap cut the list short.
  return { listings, meta: first.meta };
}

/** Browse/search, across every page. Same filters as fetchListings. */
export function fetchAllListings(params = {}) {
  return collectAllPages(fetchListings, params);
}

/** The signed-in user's listings, across every page. */
export function fetchAllMyListings(params = {}) {
  return collectAllPages(fetchMyListings, params);
}

/**
 * Publish a listing: DRAFT or UNPUBLISHED -> PUBLISHED.
 * Caller must be the owner. The listing needs at least one image whose
 * media state is "ready", otherwise the backend answers 409
 * ("No ready image attached — cannot publish yet").
 */
export async function publishListing(id) {
  const data = await apiRequest(`/listing/${id}/publish/`, { method: "POST" });
  return data.listing;
}

/**
 * Unpublish a listing: PUBLISHED -> UNPUBLISHED.
 * The listing disappears from public browse but the owner can still see it.
 */
export async function unpublishListing(id) {
  const data = await apiRequest(`/listing/${id}/unpublish/`, { method: "POST" });
  return data.listing;
}
