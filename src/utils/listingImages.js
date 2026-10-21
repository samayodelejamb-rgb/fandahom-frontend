// ---------------------------------------------------------------------
// Which photos belong to a listing — straight from the API doc.
//
// Every listing object has:
//   cover_image_url  the primary image URL (or a placeholder picture when
//                    the listing has no ready image yet)
//   media            LIST endpoints (browse, mine): at most 1 item (the
//                    cover). DETAIL endpoint (GET /listing/<id>/): every
//                    ready image and video, cover first, then by sort_order.
// ---------------------------------------------------------------------

// Only used if a listing somehow has neither (should not happen with the
// real API, which always sends cover_image_url).
const LAST_RESORT_PHOTO =
  "https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image";

/**
 * Real photo URLs for a listing: ready images only, cover photo first,
 * then by sort_order. Returns [] if the listing has none.
 */
export function getListingImages(listing) {
  const media = Array.isArray(listing?.media) ? listing.media : [];

  return media
    .filter((m) => m.media_type === "image" && m.state === "ready" && m.url)
    .sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .map((m) => m.url);
}

/**
 * The single photo for a card: the cover image from the API.
 */
export function getCoverImage(listing) {
  return listing?.cover_image_url || getListingImages(listing)[0] || LAST_RESORT_PHOTO;
}

/**
 * Everything for a detail-page gallery: every ready image AND video, cover
 * first, then by sort_order (the detail endpoint already sends them in that
 * order). Each item is { id, type: "image" | "video", url }. If the listing
 * has nothing ready, a single placeholder image.
 */
export function getGalleryMedia(listing) {
  const media = Array.isArray(listing?.media) ? listing.media : [];

  const items = media
    .filter(
      (m) =>
        (m.media_type === "image" || m.media_type === "video") &&
        m.state === "ready" &&
        m.url
    )
    .sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .map((m) => ({ id: m.id, type: m.media_type, url: m.url }));

  return items.length > 0
    ? items
    : [{ id: "cover", type: "image", url: getCoverImage(listing) }];
}

/**
 * Photos for a detail-page gallery: every ready image (cover first). If
 * there are none, the single cover/placeholder image.
 */
export function getGalleryImages(listing) {
  const images = getListingImages(listing);
  return images.length > 0 ? images : [getCoverImage(listing)];
}
