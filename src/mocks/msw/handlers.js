import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:8000";

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

// --- Fake listings store ---
// _ownerId is internal only (mirrors how a real backend tracks ownership)
// and is stripped out before any response is sent, since it's not part
// of the documented Listing object shape.
let fakeListings = [
  {
    id: 1,
    title: "3 Bedroom Flat in Lekki Phase 1",
    description: "Newly renovated, en-suite bathrooms, 24/7 power.",
    type: 1,
    tag: 2,
    price: 4500000,
    bedrooms: 3,
    bathrooms: 3,
    swimming_pool: false,
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
    longitude: 3.5765,
    latitude: 6.4281,
    is_deleted: false,
    created_at: "2026-08-28T10:00:00.000000+00:00",
    updated_at: "2026-08-28T10:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 2,
    title: "Modern 4 Bedroom Duplex",
    description: "A beautiful and spacious 4 bedroom duplex with modern facilities, fully fitted kitchen, and ample parking space.",
    type: 2,
    tag: 3,
    price: 120000000,
    bedrooms: 4,
    bathrooms: 5,
    swimming_pool: true,
    address: "Lekki Phase 1, Lagos",
    longitude: 3.4726,
    latitude: 6.4432,
    is_deleted: false,
    created_at: "2026-08-27T09:00:00.000000+00:00",
    updated_at: "2026-08-27T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 3,
    title: "Luxury Apartment",
    description: "A well-finished luxury apartment in the heart of Victoria Island, ideal for professionals.",
    type: 2,
    tag: 2,
    price: 85000000,
    bedrooms: 3,
    bathrooms: 3,
    swimming_pool: false,
    address: "Victoria Island, Lagos",
    longitude: 3.4219,
    latitude: 6.4281,
    is_deleted: false,
    created_at: "2026-08-26T09:00:00.000000+00:00",
    updated_at: "2026-08-26T09:00:00.000000+00:00",
    _ownerId: 2,
  },
  {
    id: 4,
    title: "Standard 3 Bedroom Bungalow",
    description: "A comfortable 3 bedroom bungalow in a quiet residential area, perfect for a growing family.",
    type: 2,
    tag: null,
    price: 65000000,
    bedrooms: 3,
    bathrooms: 2,
    swimming_pool: false,
    address: "Ajah, Lagos",
    longitude: 3.5852,
    latitude: 6.4698,
    is_deleted: false,
    created_at: "2026-08-25T09:00:00.000000+00:00",
    updated_at: "2026-08-25T09:00:00.000000+00:00",
    _ownerId: 2,
  },
  {
    id: 5,
    title: "5 Bedroom Detached Duplex",
    description: "An exquisite 5 bedroom fully detached duplex in a highbrow Ikoyi neighbourhood with premium finishes.",
    type: 2,
    tag: 3,
    price: 250000000,
    bedrooms: 5,
    bathrooms: 6,
    swimming_pool: true,
    address: "Ikoyi, Lagos",
    longitude: 3.4342,
    latitude: 6.4531,
    is_deleted: false,
    created_at: "2026-08-24T09:00:00.000000+00:00",
    updated_at: "2026-08-24T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 6,
    title: "Contemporary 2 Bedroom Terrace",
    description: "A cosy, contemporary 2 bedroom terrace close to shopping and schools.",
    type: 1,
    tag: 1,
    price: 1800000,
    bedrooms: 2,
    bathrooms: 2,
    swimming_pool: false,
    address: "Chevron Drive, Lagos",
    longitude: 3.5320,
    latitude: 6.4400,
    is_deleted: false,
    created_at: "2026-08-23T09:00:00.000000+00:00",
    updated_at: "2026-08-23T09:00:00.000000+00:00",
    _ownerId: 2,
  },
  {
    id: 7,
    title: "2 Bedroom Flat in Yaba",
    description: "Compact 2 bedroom flat, close to tech hubs and the mainland train station.",
    type: 1,
    tag: null,
    price: 1200000,
    bedrooms: 2,
    bathrooms: 2,
    swimming_pool: false,
    address: "Yaba, Lagos",
    longitude: 3.3792,
    latitude: 6.5095,
    is_deleted: false,
    created_at: "2026-08-22T09:00:00.000000+00:00",
    updated_at: "2026-08-22T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 8,
    title: "3 Bedroom Terrace in Surulere",
    description: "Family-friendly terrace house close to the National Stadium.",
    type: 2,
    tag: null,
    price: 55000000,
    bedrooms: 3,
    bathrooms: 3,
    swimming_pool: false,
    address: "Surulere, Lagos",
    longitude: 3.3550,
    latitude: 6.5010,
    is_deleted: false,
    created_at: "2026-08-21T09:00:00.000000+00:00",
    updated_at: "2026-08-21T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 9,
    title: "Studio Apartment in Ikeja GRA",
    description: "Compact studio, perfect for a single professional.",
    type: 1,
    tag: 1,
    price: 900000,
    bedrooms: 1,
    bathrooms: 1,
    swimming_pool: false,
    address: "Ikeja GRA, Lagos",
    longitude: 3.3465,
    latitude: 6.5762,
    is_deleted: false,
    created_at: "2026-08-20T09:00:00.000000+00:00",
    updated_at: "2026-08-20T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 10,
    title: "4 Bedroom Semi-Detached in Magodo",
    description: "Spacious semi-detached duplex in a secure, gated estate.",
    type: 2,
    tag: 2,
    price: 95000000,
    bedrooms: 4,
    bathrooms: 4,
    swimming_pool: false,
    address: "Magodo, Lagos",
    longitude: 3.3860,
    latitude: 6.6180,
    is_deleted: false,
    created_at: "2026-08-19T09:00:00.000000+00:00",
    updated_at: "2026-08-19T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 11,
    title: "2 Bedroom Apartment in Ajah",
    description: "Newly built 2 bedroom apartment close to major shopping malls.",
    type: 1,
    tag: null,
    price: 1500000,
    bedrooms: 2,
    bathrooms: 2,
    swimming_pool: false,
    address: "Ajah, Lagos",
    longitude: 3.5900,
    latitude: 6.4700,
    is_deleted: false,
    created_at: "2026-08-18T09:00:00.000000+00:00",
    updated_at: "2026-08-18T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 12,
    title: "5 Bedroom Duplex in Banana Island",
    description: "Ultra-luxury 5 bedroom duplex with private waterfront access.",
    type: 2,
    tag: 3,
    price: 850000000,
    bedrooms: 5,
    bathrooms: 6,
    swimming_pool: true,
    address: "Banana Island, Lagos",
    longitude: 3.4460,
    latitude: 6.4340,
    is_deleted: false,
    created_at: "2026-08-17T09:00:00.000000+00:00",
    updated_at: "2026-08-17T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 13,
    title: "3 Bedroom Bungalow in Gbagada",
    description: "Well-maintained 3 bedroom bungalow on a quiet close.",
    type: 2,
    tag: null,
    price: 48000000,
    bedrooms: 3,
    bathrooms: 2,
    swimming_pool: false,
    address: "Gbagada, Lagos",
    longitude: 3.3890,
    latitude: 6.5540,
    is_deleted: false,
    created_at: "2026-08-16T09:00:00.000000+00:00",
    updated_at: "2026-08-16T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 14,
    title: "1 Bedroom Flat in Yaba (Self-Contained)",
    description: "Self-contained 1 bedroom flat, ideal for students or young professionals.",
    type: 1,
    tag: 1,
    price: 700000,
    bedrooms: 1,
    bathrooms: 1,
    swimming_pool: false,
    address: "Yaba, Lagos",
    longitude: 3.3720,
    latitude: 6.5050,
    is_deleted: false,
    created_at: "2026-08-15T09:00:00.000000+00:00",
    updated_at: "2026-08-15T09:00:00.000000+00:00",
    _ownerId: 1,
  },
  {
    id: 15,
    title: "4 Bedroom Detached House in Omole",
    description: "Modern 4 bedroom detached house in Omole Phase 2 estate.",
    type: 2,
    tag: 2,
    price: 110000000,
    bedrooms: 4,
    bathrooms: 5,
    swimming_pool: true,
    address: "Omole Phase 2, Lagos",
    longitude: 3.3780,
    latitude: 6.6280,
    is_deleted: false,
    created_at: "2026-08-14T09:00:00.000000+00:00",
    updated_at: "2026-08-14T09:00:00.000000+00:00",
    _ownerId: 1,
  },
];
let nextListingId = 16;

function publicListing(l) {
  const { _ownerId, ...rest } = l;
  return rest;
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

  const bedrooms = params.get("bedrooms");
  if (bedrooms) result = result.filter((l) => l.bedrooms === Number(bedrooms));

  const bathrooms = params.get("bathrooms");
  if (bathrooms) result = result.filter((l) => l.bathrooms === Number(bathrooms));

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


export const handlers = [
  // GET /core/auth/csrf
  http.get(`${BASE_URL}/core/auth/csrf`, () => {
    return HttpResponse.json({ csrf_token: FAKE_CSRF_TOKEN });
  }),

  // POST /core/auth/register
  http.post(`${BASE_URL}/core/auth/register`, async ({ request }) => {
    const body = await request.json();
    const { firstname, lastname, email, password, password_confirmation } = body;

    if (!firstname || !lastname || !email || !password || !password_confirmation) {
      return HttpResponse.json({ error: "Missing fields" }, { status: 400 });
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
    currentSessionUserId = newUser.id; // auto-login after register, matches typical UX

    return HttpResponse.json({ user: publicUser(newUser) }, { status: 201 });
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

  // GET /listing/  (browse & search)
  http.get(`${BASE_URL}/listing/`, ({ request }) => {
    const url = new URL(request.url);
    const filtered = applyListingFilters(fakeListings, url.searchParams);
    const { pageItems, meta } = paginate(filtered, url.searchParams);
    return HttpResponse.json(
      { listings: pageItems.map(publicListing), meta },
      { status: 200 }
    );
  }),

  // POST /listing/  (create)
  http.post(`${BASE_URL}/listing/`, async ({ request }) => {
    if (!currentSessionUserId) {
      return HttpResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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
  http.get(`${BASE_URL}/listing/mine/`, ({ request }) => {
    if (!currentSessionUserId) {
      return HttpResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const url = new URL(request.url);
    const mine = fakeListings.filter((l) => l._ownerId === currentSessionUserId);
    const filtered = applyListingFilters(mine, url.searchParams);
    const { pageItems, meta } = paginate(filtered, url.searchParams);
    return HttpResponse.json(
      { listings: pageItems.map(publicListing), meta },
      { status: 200 }
    );
  }),

  // GET /listing/<id>/
  http.get(`${BASE_URL}/listing/:id/`, ({ params }) => {
    const listing = fakeListings.find((l) => l.id === Number(params.id));
    if (!listing || listing.is_deleted) {
      return HttpResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    return HttpResponse.json({ listing: publicListing(listing) }, { status: 200 });
  }),

  // PATCH /listing/<id>/  (update — NOT in the documented API, built on an
  // assumed shape; confirm real endpoint with backend dev before going live)
  http.patch(`${BASE_URL}/listing/:id/`, async ({ params, request }) => {
    if (!currentSessionUserId) {
      return HttpResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
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

  // DELETE /listing/<id>/
  http.delete(`${BASE_URL}/listing/:id/`, ({ params }) => {
    if (!currentSessionUserId) {
      return HttpResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
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
];