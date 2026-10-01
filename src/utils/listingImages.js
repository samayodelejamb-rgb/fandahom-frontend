const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
];

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
 * The single photo to show on a card: the cover image, or a stock photo
 * if the listing has no ready image.
 */
export function getCoverImage(listing) {
  const images = getListingImages(listing);
  if (images.length > 0) return images[0];
  return FALLBACK_PHOTOS[listing.id % FALLBACK_PHOTOS.length];
}

/**
 * Photos for a detail-page gallery: all real images, or one stock photo
 * if there are none.
 */
export function getGalleryImages(listing) {
  const images = getListingImages(listing);
  return images.length > 0 ? images : [getCoverImage(listing)];
}