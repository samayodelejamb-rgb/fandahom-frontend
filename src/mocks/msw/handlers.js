import { http, HttpResponse } from "msw";

import { API_BASE_URL as BASE_URL, MOCK_STORAGE_URL as MOCK_S3_HOST } from "../../config";

// Fake "S3" address (same origin as the app — see src/config.js). The real
// backend hands the browser a presigned S3 URL; here we hand out a URL on
// this fake address and intercept the PUT below.

// --- Fake in-memory "database" and "session", just for local testing ---
// This lives only in browser memory and resets on every page refresh.
let fakeUsers = [
  {
    id: 1,
    email: "amara@example.com",
    first_name: "Amara",
    last_name: "Okafor",
    password: "Secure@123", // never do this for real — mock only
  },
  {
    id: 2,
    email: "tunde@example.com",
    first_name: "Tunde",
    last_name: "Bakare",
    password: "Secure@123",
  },
];
let nextUserId = 3;
let currentSessionUserId = null; // null = nobody logged in

const FAKE_CSRF_TOKEN = "mock-csrf-token-12345";

function publicUser(u) {
  return { id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name };
}

function isStrongPassword(pw) {
  return (
    typeof pw === "string" &&
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

// ---------------------------------------------------------------------
// Email codes (OTP) for registration and password reset
// ---------------------------------------------------------------------
// The real backend emails a random 6-digit code that expires after 15
// minutes, and allows 3 code requests per hour per email. The mock uses the
// fixed code 123456 (the UI shows a "Demo mode" hint) and the same limits.
const MOCK_OTP_CODE = "123456";
const OTP_LIFETIME_MS = 15 * 60 * 1000;
const OTP_REQUESTS_PER_HOUR = 3;

const pendingRegistrations = new Map(); // email -> { code, expiresAt }
const pendingPasswordResets = new Map();
const otpRequestLog = new Map(); // email -> [timestamps]

function tooManyOtpRequests(email) {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recent = (otpRequestLog.get(email) || []).filter((t) => t > hourAgo);
  if (recent.length >= OTP_REQUESTS_PER_HOUR) return true;
  otpRequestLog.set(email, [...recent, Date.now()]);
  return false;
}

function issueOtp(store, email) {
  store.set(email, { code: MOCK_OTP_CODE, expiresAt: Date.now() + OTP_LIFETIME_MS });
}

function otpIsValid(store, email, code) {
  const entry = store.get(email);
  return !!entry && entry.code === String(code) && Date.now() < entry.expiresAt;
}

// ---------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------

// Listing status values (from the API doc's "Listing status" table).
const STATUS = { DRAFT: 1, PUBLISHED: 2, UNPUBLISHED: 3 };

// Small helper so the seed data below stays readable. Anything not
// specified defaults to a PUBLISHED, non-deleted listing.
// _ownerId is internal only (mirrors how a real backend tracks ownership)
// and is stripped out before any response is sent.
function makeListing(id, ownerId, fields) {
  const stamp = `2026-08-${String(29 - id).padStart(2, "0")}T09:00:00.000000+00:00`;
  return {
    id,
    description: "",
    tag: null,
    swimming_pool: false,
    status: STATUS.PUBLISHED,
    is_deleted: false,
    created_at: stamp,
    updated_at: stamp,
    _ownerId: ownerId,
    ...fields,
  };
}

let fakeListings = [
  makeListing(1, 1, {
    title: "3 Bedroom Flat in Lekki Phase 1",
    description: "Newly renovated, en-suite bathrooms, 24/7 power.",
    type: 1, tag: 2, price: 4500000, bedrooms: 3, bathrooms: 3,
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
    longitude: 3.5765, latitude: 6.4281,
  }),
  makeListing(2, 1, {
    title: "Modern 4 Bedroom Duplex",
    description: "A beautiful and spacious 4 bedroom duplex with modern facilities, fully fitted kitchen, and ample parking space.",
    type: 2, tag: 3, price: 120000000, bedrooms: 4, bathrooms: 5, swimming_pool: true,
    address: "Lekki Phase 1, Lagos",
    longitude: 3.4726, latitude: 6.4432,
  }),
  makeListing(3, 2, {
    title: "Luxury Apartment",
    description: "A well-finished luxury apartment in the heart of Victoria Island, ideal for professionals.",
    type: 2, tag: 2, price: 85000000, bedrooms: 3, bathrooms: 3,
    address: "Victoria Island, Lagos",
    longitude: 3.4219, latitude: 6.4281,
  }),
  makeListing(4, 2, {
    title: "Standard 3 Bedroom Bungalow",
    description: "A comfortable 3 bedroom bungalow in a quiet residential area, perfect for a growing family.",
    type: 2, price: 65000000, bedrooms: 3, bathrooms: 2,
    address: "Ajah, Lagos",
    longitude: 3.5852, latitude: 6.4698,
  }),
  makeListing(5, 1, {
    title: "5 Bedroom Detached Duplex",
    description: "An exquisite 5 bedroom fully detached duplex in a highbrow Ikoyi neighbourhood with premium finishes.",
    type: 2, tag: 3, price: 250000000, bedrooms: 5, bathrooms: 6, swimming_pool: true,
    address: "Ikoyi, Lagos",
    longitude: 3.4342, latitude: 6.4531,
  }),
  makeListing(6, 2, {
    title: "Contemporary 2 Bedroom Terrace",
    description: "A cosy, contemporary 2 bedroom terrace close to shopping and schools.",
    type: 1, tag: 1, price: 1800000, bedrooms: 2, bathrooms: 2,
    address: "Chevron Drive, Lagos",
    longitude: 3.532, latitude: 6.44,
  }),
  makeListing(7, 1, {
    title: "2 Bedroom Flat in Yaba",
    description: "Compact 2 bedroom flat, close to tech hubs and the mainland train station.",
    type: 1, price: 1200000, bedrooms: 2, bathrooms: 2,
    address: "Yaba, Lagos",
    longitude: 3.3792, latitude: 6.5095,
  }),
  makeListing(8, 1, {
    title: "3 Bedroom Terrace in Surulere",
    description: "Family-friendly terrace house close to the National Stadium.",
    type: 2, price: 55000000, bedrooms: 3, bathrooms: 3,
    address: "Surulere, Lagos",
    longitude: 3.355, latitude: 6.501,
  }),
  // Test data: a DRAFT owned by Amara (user 1). Hidden from public browse.
  makeListing(9, 1, {
    title: "Studio Apartment in Ikeja GRA",
    description: "Compact studio, perfect for a single professional.",
    type: 1, tag: 1, price: 900000, bedrooms: 1, bathrooms: 1,
    address: "Ikeja GRA, Lagos",
    longitude: 3.3465, latitude: 6.5762,
    status: STATUS.DRAFT,
  }),
  makeListing(10, 1, {
    title: "4 Bedroom Semi-Detached in Magodo",
    description: "Spacious semi-detached duplex in a secure, gated estate.",
    type: 2, tag: 2, price: 95000000, bedrooms: 4, bathrooms: 4,
    address: "Magodo, Lagos",
    longitude: 3.386, latitude: 6.618,
  }),
  makeListing(11, 1, {
    title: "2 Bedroom Apartment in Ajah",
    description: "Newly built 2 bedroom apartment close to major shopping malls.",
    type: 1, price: 1500000, bedrooms: 2, bathrooms: 2,
    address: "Ajah, Lagos",
    longitude: 3.59, latitude: 6.47,
  }),
  makeListing(12, 1, {
    title: "5 Bedroom Duplex in Banana Island",
    description: "Ultra-luxury 5 bedroom duplex with private waterfront access.",
    type: 2, tag: 3, price: 850000000, bedrooms: 5, bathrooms: 6, swimming_pool: true,
    address: "Banana Island, Lagos",
    longitude: 3.446, latitude: 6.434,
  }),
  makeListing(13, 1, {
    title: "3 Bedroom Bungalow in Gbagada",
    description: "Well-maintained 3 bedroom bungalow on a quiet close.",
    type: 2, price: 48000000, bedrooms: 3, bathrooms: 2,
    address: "Gbagada, Lagos",
    longitude: 3.389, latitude: 6.554,
  }),
  // Test data: an UNPUBLISHED listing owned by Amara. Hidden from public browse.
  makeListing(14, 1, {
    title: "1 Bedroom Flat in Yaba (Self-Contained)",
    description: "Self-contained 1 bedroom flat, ideal for students or young professionals.",
    type: 1, tag: 1, price: 700000, bedrooms: 1, bathrooms: 1,
    address: "Yaba, Lagos",
    longitude: 3.372, latitude: 6.505,
    status: STATUS.UNPUBLISHED,
  }),
  makeListing(15, 1, {
    title: "4 Bedroom Detached House in Omole",
    description: "Modern 4 bedroom detached house in Omole Phase 2 estate.",
    type: 2, tag: 2, price: 110000000, bedrooms: 4, bathrooms: 5, swimming_pool: true,
    address: "Omole Phase 2, Lagos",
    longitude: 3.378, latitude: 6.628,
  }),
];
let nextListingId = 16;

// ---------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------

// Allowed MIME types + max sizes (from the API doc's reference table).
const MEDIA_RULES = {
  image: {
    mimes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 20 * 1024 * 1024,
  },
  video: {
    mimes: ["video/mp4", "video/quicktime", "video/webm"],
    maxBytes: 2 * 1024 * 1024 * 1024,
  },
};

const SEED_PHOTOS = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
];

// Internal media records. (The API only exposes a subset of these fields —
// see publicMedia() below.)
//   uploaded    -> did the mock "S3" receive the PUT?
//   confirmedAt -> timestamp of POST /media/confirm/ (null until then)
//   seedUrl     -> for pre-made demo photos that are instantly "ready"
//   localUrl    -> object URL of the file the user really uploaded
let fakeMedia = [];
let nextMediaId = 1;

// Give every non-draft seed listing one ready demo photo, so the browse
// page still has pictures without anyone uploading anything.
fakeListings.forEach((l) => {
  if (l.status === STATUS.DRAFT) return;
  const now = l.created_at;
  fakeMedia.push({
    id: nextMediaId++,
    owner_type: "listing",
    owner_id: l.id,
    uploader_id: l._ownerId,
    media_type: "image",
    mime_type: "image/jpeg",
    file_name: `seed-${l.id}.jpg`,
    file_size: 1024,
    sort_order: 0,
    uploaded: true,
    confirmedAt: 0,
    infected: false,
    seedUrl: SEED_PHOTOS[l.id % SEED_PHOTOS.length],
    localUrl: null,
    created_at: now,
    updated_at: now,
  });
});

// Media processing is asynchronous on the real backend. We fake that by
// deriving the state from how long ago the upload was confirmed, so
// polling GET /media/<id>/ sees the state advance over a few seconds.
function mediaState(m) {
  if (m.seedUrl) return "ready";
  if (!m.confirmedAt) return "pending_scan";

  const elapsed = Date.now() - m.confirmedAt;
  const steps =
    m.media_type === "video"
      ? [["pending_scan", 1500], ["scanning", 3000], ["pending_transcode", 4500], ["transcoding", 7000]]
      : [["pending_scan", 1500], ["scanning", 3000]];

  for (const [state, until] of steps) {
    if (elapsed < until) return state;
  }
  return m.infected ? "infected" : "ready";
}

function publicMedia(m, isCover = false) {
  const state = mediaState(m);
  const ready = state === "ready";
  return {
    id: m.id,
    media_type: m.media_type,
    mime_type: m.mime_type,
    file_name: m.file_name,
    file_size: m.file_size,
    state,
    width: ready ? 1920 : null,
    height: ready ? 1080 : null,
    duration_secs: ready && m.media_type === "video" ? 30 : null,
    sort_order: m.sort_order,
    is_cover: isCover,
    // url is only present once state is "ready" (matches the API doc)
    url: ready ? m.seedUrl || m.localUrl || SEED_PHOTOS[0] : null,
    created_at: m.created_at,
    updated_at: m.updated_at,
  };
}

// Every READY image and video attached to a listing, in display order.
function readyListingMedia(listingId) {
  return fakeMedia
    .filter(
      (m) =>
        m.owner_type === "listing" &&
        m.owner_id === listingId &&
        mediaState(m) === "ready"
    )
    .sort((a, b) => a.sort_order - b.sort_order);
}

// Ready IMAGES only (publishing needs at least one of these).
function readyListingImages(listingId) {
  return readyListingMedia(listingId).filter((m) => m.media_type === "image");
}

// Shown by the real API when a listing has no ready image yet.
const PLACEHOLDER_IMAGE = "https://placehold.co/800x600/e2e8f0/94a3b8?text=No+Image";

// A listing exactly as the API doc describes it:
//   cover_image_url  the cover image URL, or a placeholder
//   media            LIST endpoints: at most 1 item (the cover image).
//                    DETAIL endpoint (detail = true): every ready image and
//                    video, cover first, then by sort_order.
function publicListing(l, detail = false) {
  const { _ownerId, ...rest } = l;
  const ready = readyListingMedia(l.id);
  const cover = ready.find((m) => m.media_type === "image") || null;

  let media = [];
  if (detail) {
    const others = ready.filter((m) => m !== cover);
    media = (cover ? [cover, ...others] : others).map((m) => publicMedia(m, m === cover));
  } else if (cover) {
    media = [publicMedia(cover, true)];
  }

  return {
    ...rest,
    cover_image_url: cover ? publicMedia(cover, true).url : PLACEHOLDER_IMAGE,
    media,
  };
}

// Who can see a single listing? (API doc: "Visibility rules")
function canViewListing(listing, userId) {
  if (!listing || listing.is_deleted) return false;
  if (listing.status === STATUS.PUBLISHED) return true;
  return !!userId && listing._ownerId === userId;
}

// Distance in km between two coordinates (haversine formula).
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function applyListingFilters(listings, params) {
  let result = listings.filter((l) => !l.is_deleted);

  const q = params.get("q");
  if (q) {
    const term = q.toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(term) ||
        (l.description || "").toLowerCase().includes(term) ||
        l.address.toLowerCase().includes(term)
    );
  }

  const type = params.get("type");
  if (type) result = result.filter((l) => l.type === Number(type));

  const tag = params.get("tag");
  if (tag) result = result.filter((l) => l.tag === Number(tag));

  const minPrice = params.get("min_price");
  if (minPrice) result = result.filter((l) => l.price >= Number(minPrice));

  const maxPrice = params.get("max_price");
  if (maxPrice) result = result.filter((l) => l.price <= Number(maxPrice));

  // NOTE: the real API does an EXACT match on bedrooms/bathrooms.
  const bedrooms = params.get("bedrooms");
  if (bedrooms) result = result.filter((l) => l.bedrooms === Number(bedrooms));

  const bathrooms = params.get("bathrooms");
  if (bathrooms) result = result.filter((l) => l.bathrooms === Number(bathrooms));

  // Proximity search: needs all three of lat, lng and radius_km (per the
  // API doc). Listings without coordinates are left out.
  const lat = params.get("lat");
  const lng = params.get("lng");
  const radiusKm = params.get("radius_km");
  if (lat && lng && radiusKm) {
    const [la, ln, r] = [Number(lat), Number(lng), Number(radiusKm)];
    result = result.filter(
      (l) =>
        l.latitude != null &&
        l.longitude != null &&
        distanceKm(la, ln, l.latitude, l.longitude) <= r
    );
  }

  const swimmingPool = params.get("swimming_pool");
  if (swimmingPool !== null) result = result.filter((l) => l.swimming_pool === (swimmingPool === "true"));

  return result;
}

function paginate(listings, params) {
  const page = Number(params.get("page")) || 1;
  const limit = Math.min(Number(params.get("limit")) || 20, 100);
  const total = listings.length;
  const total_pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageItems = listings.slice(start, start + limit);
  return { pageItems, meta: { page, limit, total, total_pages } };
}

const notAuthenticated = () =>
  HttpResponse.json({ error: "Not authenticated" }, { status: 401 });

// ---------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------

export const handlers = [
  // ---------- Auth ----------

  // GET /core/auth/csrf
  http.get(`${BASE_URL}/core/auth/csrf`, () => {
    return HttpResponse.json({ csrf_token: FAKE_CSRF_TOKEN });
  }),

  // POST /core/auth/register/   (step 1: email a 6-digit code)
  http.post(`${BASE_URL}/core/auth/register/`, async ({ request }) => {
    const { email } = await request.json();

    if (!email) return HttpResponse.json({ error: "Missing email" }, { status: 400 });
    if (fakeUsers.some((u) => u.email === email)) {
      return HttpResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    if (tooManyOtpRequests(email)) {
      return HttpResponse.json(
        { error: "Too many requests. Please wait and try again later." },
        { status: 429 }
      );
    }

    issueOtp(pendingRegistrations, email);
    return HttpResponse.json(
      { message: `Verification code sent to ${email}` },
      { status: 200 }
    );
  }),

  // POST /core/auth/register/verify/   (step 2: check the code, create the
  // account). Like the real API, this does NOT start a session.
  http.post(`${BASE_URL}/core/auth/register/verify/`, async ({ request }) => {
    const body = await request.json();
    const { email, code, firstname, lastname, password, password_confirmation } = body;

    if (!email || !code || !firstname || !lastname || !password || !password_confirmation) {
      return HttpResponse.json({ error: "Missing required field" }, { status: 400 });
    }
    if (password !== password_confirmation) {
      return HttpResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }
    if (!isStrongPassword(password)) {
      return HttpResponse.json(
        { error: "Password does not meet strength requirements" },
        { status: 400 }
      );
    }
    if (!otpIsValid(pendingRegistrations, email, code)) {
      return HttpResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }
    if (fakeUsers.some((u) => u.email === email)) {
      return HttpResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const newUser = {
      id: nextUserId++,
      email,
      first_name: firstname,
      last_name: lastname,
      password,
    };
    fakeUsers.push(newUser);
    pendingRegistrations.delete(email);

    return HttpResponse.json({ user: publicUser(newUser) }, { status: 201 });
  }),

  // POST /core/auth/password/reset/   (step 1: email a code). Always 200,
  // whether or not the email has an account.
  http.post(`${BASE_URL}/core/auth/password/reset/`, async ({ request }) => {
    const { email } = await request.json();

    if (!email) return HttpResponse.json({ error: "Missing email" }, { status: 400 });
    if (tooManyOtpRequests(email)) {
      return HttpResponse.json(
        { error: "Too many requests. Please wait and try again later." },
        { status: 429 }
      );
    }

    if (fakeUsers.some((u) => u.email === email)) {
      issueOtp(pendingPasswordResets, email);
    }
    return HttpResponse.json(
      { message: `If an account exists for ${email}, a reset code has been sent.` },
      { status: 200 }
    );
  }),

  // POST /core/auth/password/reset/verify/   (step 2: check the code, set
  // the new password). Does not start a session.
  http.post(`${BASE_URL}/core/auth/password/reset/verify/`, async ({ request }) => {
    const { email, code, password, password_confirmation } = await request.json();

    if (!email || !code || !password || !password_confirmation) {
      return HttpResponse.json({ error: "Missing required field" }, { status: 400 });
    }
    if (password !== password_confirmation) {
      return HttpResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }
    if (!isStrongPassword(password)) {
      return HttpResponse.json(
        { error: "Password does not meet strength requirements" },
        { status: 400 }
      );
    }
    if (!otpIsValid(pendingPasswordResets, email, code)) {
      return HttpResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const user = fakeUsers.find((u) => u.email === email);
    if (!user) return HttpResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    user.password = password;
    pendingPasswordResets.delete(email);
    return HttpResponse.json({}, { status: 200 });
  }),

  // POST /core/auth/login
  http.post(`${BASE_URL}/core/auth/login`, async ({ request }) => {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return HttpResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const user = fakeUsers.find((u) => u.email === email && u.password === password);
    if (!user) {
      return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    currentSessionUserId = user.id;
    return HttpResponse.json({ user: publicUser(user) }, { status: 200 });
  }),

  // POST /core/auth/logout
  http.post(`${BASE_URL}/core/auth/logout`, () => {
    currentSessionUserId = null;
    return HttpResponse.json({}, { status: 200 });
  }),

  // GET /core/auth/me
  http.get(`${BASE_URL}/core/auth/me`, () => {
    const user = fakeUsers.find((u) => u.id === currentSessionUserId);
    return HttpResponse.json({ user: user ? publicUser(user) : null }, { status: 200 });
  }),

  // ---------- Listings ----------

  // GET /listing/  (browse & search) — PUBLISHED listings only
  http.get(`${BASE_URL}/listing/`, ({ request }) => {
    const url = new URL(request.url);
    const published = fakeListings.filter((l) => l.status === STATUS.PUBLISHED);
    const filtered = applyListingFilters(published, url.searchParams);
    const { pageItems, meta } = paginate(filtered, url.searchParams);
    return HttpResponse.json(
      { listings: pageItems.map((l) => publicListing(l)), meta },
      { status: 200 }
    );
  }),

  // POST /listing/  (create) — always starts as a DRAFT
  http.post(`${BASE_URL}/listing/`, async ({ request }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const body = await request.json();
    const { title, price, address, type } = body;

    if (!title || price === undefined || price === null || !address || !type) {
      return HttpResponse.json({ error: "Missing or invalid required field" }, { status: 400 });
    }
    if (typeof price !== "number" || price < 0) {
      return HttpResponse.json({ error: "Missing or invalid required field" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newListing = {
      id: nextListingId++,
      title,
      description: body.description || "",
      type: Number(type),
      tag: body.tag ? Number(body.tag) : null,
      price,
      bedrooms: body.bedrooms ?? null,
      bathrooms: body.bathrooms ?? null,
      swimming_pool: body.swimming_pool ?? false,
      address,
      longitude: body.longitude ?? null,
      latitude: body.latitude ?? null,
      status: STATUS.DRAFT,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      _ownerId: currentSessionUserId,
    };

    fakeListings.push(newListing);
    return HttpResponse.json({ listing: publicListing(newListing) }, { status: 201 });
  }),

  // GET /listing/mine/  (must be registered BEFORE /listing/:id/ below,
  // otherwise MSW would try to match "mine" as an :id)
  // Returns all non-deleted listings the user owns, any status.
  // Optional ?status=1|2|3 filter.
  http.get(`${BASE_URL}/listing/mine/`, ({ request }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const url = new URL(request.url);
    let mine = fakeListings.filter(
      (l) => l._ownerId === currentSessionUserId && !l.is_deleted
    );

    const statusParam = url.searchParams.get("status");
    if (statusParam !== null && statusParam !== "") {
      const wanted = Number(statusParam);
      if (![STATUS.DRAFT, STATUS.PUBLISHED, STATUS.UNPUBLISHED].includes(wanted)) {
        return HttpResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      mine = mine.filter((l) => l.status === wanted);
    }

    const filtered = applyListingFilters(mine, url.searchParams);
    const { pageItems, meta } = paginate(filtered, url.searchParams);
    return HttpResponse.json(
      { listings: pageItems.map((l) => publicListing(l)), meta },
      { status: 200 }
    );
  }),

  // GET /listing/<id>/  — visibility depends on status + who is asking
  http.get(`${BASE_URL}/listing/:id/`, ({ params }) => {
    const listing = fakeListings.find((l) => l.id === Number(params.id));
    if (!canViewListing(listing, currentSessionUserId)) {
      return HttpResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return HttpResponse.json({ listing: publicListing(listing, true) }, { status: 200 });
  }),

  // GET /listing/<id>/media/  — every media item attached to a listing.
  // The owner sees items in ANY state (for progress polling); everyone
  // else sees READY items only.
  http.get(`${BASE_URL}/listing/:id/media/`, ({ params }) => {
    const listing = fakeListings.find((l) => l.id === Number(params.id));
    if (!listing || listing.is_deleted) {
      return HttpResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const isOwner = !!currentSessionUserId && listing._ownerId === currentSessionUserId;
    const all = fakeMedia
      .filter((m) => m.owner_type === "listing" && m.owner_id === listing.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const visible = isOwner ? all : all.filter((m) => mediaState(m) === "ready");

    const cover = readyListingMedia(listing.id).find((m) => m.media_type === "image");
    return HttpResponse.json(
      { media: visible.map((m) => publicMedia(m, m === cover)) },
      { status: 200 }
    );
  }),

  // PATCH /listing/<id>/  (update — NOT in the documented API, built on an
  // assumed shape; confirm real endpoint with backend dev before going live)
  http.patch(`${BASE_URL}/listing/:id/`, async ({ params, request }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const listing = fakeListings.find((l) => l.id === Number(params.id));
    if (!listing || listing.is_deleted) {
      return HttpResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing._ownerId !== currentSessionUserId) {
      return HttpResponse.json({ error: "Not an owner or staff" }, { status: 403 });
    }

    const body = await request.json();
    const { title, price, address, type } = body;

    if (!title || price === undefined || price === null || !address || !type) {
      return HttpResponse.json({ error: "Missing or invalid required field" }, { status: 400 });
    }
    if (typeof price !== "number" || price < 0) {
      return HttpResponse.json({ error: "Missing or invalid required field" }, { status: 400 });
    }

    Object.assign(listing, {
      title,
      description: body.description || "",
      type: Number(type),
      tag: body.tag ? Number(body.tag) : null,
      price,
      bedrooms: body.bedrooms ?? null,
      bathrooms: body.bathrooms ?? null,
      swimming_pool: body.swimming_pool ?? false,
      address,
      longitude: body.longitude ?? listing.longitude,
      latitude: body.latitude ?? listing.latitude,
      updated_at: new Date().toISOString(),
    });

    return HttpResponse.json({ listing: publicListing(listing) }, { status: 200 });
  }),

  // DELETE /listing/<id>/  (soft delete)
  http.delete(`${BASE_URL}/listing/:id/`, ({ params }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const listing = fakeListings.find((l) => l.id === Number(params.id));
    if (!listing || listing.is_deleted) {
      return HttpResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing._ownerId !== currentSessionUserId) {
      return HttpResponse.json({ error: "Not an owner or staff" }, { status: 403 });
    }
    listing.is_deleted = true;
    return HttpResponse.json({}, { status: 200 });
  }),

  // POST /listing/<id>/publish/   DRAFT | UNPUBLISHED -> PUBLISHED
  http.post(`${BASE_URL}/listing/:id/publish/`, ({ params }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const listing = fakeListings.find((l) => l.id === Number(params.id));
    if (!listing || listing.is_deleted) {
      return HttpResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing._ownerId !== currentSessionUserId) {
      return HttpResponse.json({ error: "Not an owner or staff" }, { status: 403 });
    }
    if (listing.status === STATUS.PUBLISHED) {
      return HttpResponse.json({ error: "Listing is already published" }, { status: 409 });
    }
    if (readyListingImages(listing.id).length === 0) {
      return HttpResponse.json(
        { error: "No ready image attached — cannot publish yet" },
        { status: 409 }
      );
    }

    listing.status = STATUS.PUBLISHED;
    listing.updated_at = new Date().toISOString();
    return HttpResponse.json({ listing: publicListing(listing) }, { status: 200 });
  }),

  // POST /listing/<id>/unpublish/   PUBLISHED -> UNPUBLISHED
  http.post(`${BASE_URL}/listing/:id/unpublish/`, ({ params }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const listing = fakeListings.find((l) => l.id === Number(params.id));
    if (!listing || listing.is_deleted) {
      return HttpResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing._ownerId !== currentSessionUserId) {
      return HttpResponse.json({ error: "Not an owner or staff" }, { status: 403 });
    }
    if (listing.status !== STATUS.PUBLISHED) {
      return HttpResponse.json({ error: "Listing is not published" }, { status: 409 });
    }

    listing.status = STATUS.UNPUBLISHED;
    listing.updated_at = new Date().toISOString();
    return HttpResponse.json({ listing: publicListing(listing) }, { status: 200 });
  }),

  // ---------- Media ----------

  // POST /media/init/  -> creates a pending Media record + "presigned" URL
  http.post(`${BASE_URL}/media/init/`, async ({ request }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const body = await request.json();
    const { owner_type, owner_id, media_type, mime_type, file_size, file_name } = body;

    const rules = MEDIA_RULES[media_type];
    if (
      !["listing", "user"].includes(owner_type) ||
      typeof owner_id !== "number" ||
      !rules ||
      !rules.mimes.includes(mime_type) ||
      typeof file_size !== "number" ||
      file_size <= 0 ||
      !file_name
    ) {
      return HttpResponse.json({ error: "Missing or invalid field" }, { status: 400 });
    }
    if (file_size > rules.maxBytes) {
      return HttpResponse.json(
        { error: "file_size exceeds the maximum for this media type" },
        { status: 400 }
      );
    }

    if (owner_type === "listing") {
      const listing = fakeListings.find((l) => l.id === owner_id && !l.is_deleted);
      if (!listing) return HttpResponse.json({ error: "Owner not found" }, { status: 404 });
      if (listing._ownerId !== currentSessionUserId) {
        return HttpResponse.json(
          { error: "Not authorised to attach media to this owner" },
          { status: 403 }
        );
      }
    } else {
      const user = fakeUsers.find((u) => u.id === owner_id);
      if (!user) return HttpResponse.json({ error: "Owner not found" }, { status: 404 });
      if (user.id !== currentSessionUserId) {
        return HttpResponse.json(
          { error: "Not authorised to attach media to this owner" },
          { status: 403 }
        );
      }
    }

    const now = new Date().toISOString();
    const media = {
      id: nextMediaId++,
      owner_type,
      owner_id,
      uploader_id: currentSessionUserId,
      media_type,
      mime_type,
      file_name,
      file_size,
      sort_order: fakeMedia.filter(
        (m) => m.owner_type === owner_type && m.owner_id === owner_id
      ).length,
      uploaded: false,
      confirmedAt: null,
      infected: false,
      seedUrl: null,
      localUrl: null,
      created_at: now,
      updated_at: now,
    };
    fakeMedia.push(media);

    const folder = owner_type === "listing" ? `listings/${owner_id}` : `users/${owner_id}`;
    return HttpResponse.json(
      {
        media_id: media.id,
        upload_url: `${MOCK_S3_HOST}/media/${media.id}/upload?X-Amz-Signature=mock`,
        file_key: `${folder}/${media_type}s/mock-${media.id}`,
        expires_in: 300,
      },
      { status: 201 }
    );
  }),

  // PUT <presigned url>  — the fake "S3". The real bytes never reach a
  // server; we just keep an object URL so the user sees their own photo.
  http.put(`${MOCK_S3_HOST}/media/:mediaId/upload`, async ({ params, request }) => {
    const cors = { "Access-Control-Allow-Origin": "*" };
    const media = fakeMedia.find((m) => m.id === Number(params.mediaId));
    if (!media) {
      return new HttpResponse("NoSuchKey", { status: 404, headers: cors });
    }

    // Real S3 rejects the upload if the Content-Type differs from the one
    // that was signed at /media/init/. Mimic that so bugs show up here.
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith(media.mime_type)) {
      return new HttpResponse("SignatureDoesNotMatch", { status: 403, headers: cors });
    }

    const blob = await request.blob();
    media.localUrl = URL.createObjectURL(blob);
    media.uploaded = true;
    return new HttpResponse(null, { status: 200, headers: cors });
  }),

  // POST /media/confirm/  -> starts the (fake) background processing
  http.post(`${BASE_URL}/media/confirm/`, async ({ request }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const body = await request.json();
    if (body.media_id === undefined || body.media_id === null) {
      return HttpResponse.json({ error: "Missing media_id" }, { status: 400 });
    }

    const media = fakeMedia.find(
      (m) => m.id === Number(body.media_id) && m.uploader_id === currentSessionUserId
    );
    if (!media) {
      return HttpResponse.json(
        { error: "Media record not found or does not belong to this user" },
        { status: 404 }
      );
    }
    if (media.confirmedAt) {
      return HttpResponse.json(
        { error: "Media is already past pending_scan state" },
        { status: 409 }
      );
    }
    if (!media.uploaded) {
      return HttpResponse.json(
        { error: "File not found in S3 (upload did not complete)" },
        { status: 400 }
      );
    }

    media.confirmedAt = Date.now();
    // Test hook: a file whose name contains "infected" fails the virus scan.
    media.infected = /infected/i.test(media.file_name);
    media.updated_at = new Date().toISOString();
    return HttpResponse.json({ media: publicMedia(media) }, { status: 200 });
  }),

  // GET /media/<id>/  (poll this until state === "ready")
  http.get(`${BASE_URL}/media/:id/`, ({ params }) => {
    const media = fakeMedia.find((m) => m.id === Number(params.id));
    if (!media) return HttpResponse.json({ error: "Media not found" }, { status: 404 });

    return HttpResponse.json({ media: publicMedia(media) }, { status: 200 });
  }),

  // DELETE /media/<id>/
  http.delete(`${BASE_URL}/media/:id/`, ({ params }) => {
    if (!currentSessionUserId) return notAuthenticated();

    const media = fakeMedia.find((m) => m.id === Number(params.id));
    if (!media) return HttpResponse.json({ error: "Media not found" }, { status: 404 });

    const listing =
      media.owner_type === "listing"
        ? fakeListings.find((l) => l.id === media.owner_id)
        : null;
    const allowed =
      media.uploader_id === currentSessionUserId ||
      (listing && listing._ownerId === currentSessionUserId);
    if (!allowed) {
      return HttpResponse.json({ error: "Not authorised" }, { status: 403 });
    }

    if (media.localUrl) URL.revokeObjectURL(media.localUrl);
    fakeMedia = fakeMedia.filter((m) => m.id !== media.id);
    return HttpResponse.json({}, { status: 200 });
  }),
];
