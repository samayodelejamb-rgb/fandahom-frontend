import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Trash2, Pencil, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAllMyListings, deleteListing } from "../../services/listingApi";
import "./MyListingsPage.css";

const TYPE_LABELS = { 1: "Rent", 2: "Sale" };
const STATUS_LABELS = { 1: "Draft", 2: "Published", 3: "Unpublished" };
const PAGE_SIZE = 10;

function MyListingsPage() {
  const [allListings, setAllListings] = useState([]);
  const [serverTotal, setServerTotal] = useState(0);
  const location = useLocation();
  const justCreatedId = location.state?.justCreatedId;
  // Which tab to open first. The photos page passes the tab matching the
  // listing's status, so you land next to the listing you were working on.
  const requestedTab = location.state?.tab;
  const [tab, setTab] = useState(
    ["published", "drafts", "unpublished"].includes(requestedTab) ? requestedTab : "published"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllMyListings();
      setAllListings(data.listings);
      setServerTotal(data.meta?.total ?? data.listings.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing? This can't be undone.")) return;
    try {
      await deleteListing(id);
      setAllListings((prev) => prev.filter((l) => l.id !== id));
      setServerTotal((prev) => prev - 1);
    } catch (err) {
      setError(err.message);
    }
  };

  // Tabs follow the API's listing status values exactly:
  //   Published = 2, Draft = 1, Unpublished = 3
  const publishedListings = allListings.filter((l) => l.status === 2);
  const draftListings = allListings.filter((l) => l.status === 1);
  const unpublishedListings = allListings.filter((l) => l.status === 3);
  const tabListings = {
    published: publishedListings,
    drafts: draftListings,
    unpublished: unpublishedListings,
  }[tab];

  // "Unpublished" only appears once you have at least one.
  const tabs = [
    { key: "published", label: "Published", count: publishedListings.length },
    { key: "drafts", label: "Drafts", count: draftListings.length },
    ...(unpublishedListings.length > 0 || tab === "unpublished"
      ? [{ key: "unpublished", label: "Unpublished", count: unpublishedListings.length }]
      : []),
  ];

  const totalPages = Math.max(1, Math.ceil(tabListings.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageListings = tabListings.slice(pageStart, pageStart + PAGE_SIZE);

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="my-listings-page">
      <div className="my-listings-page__header">
        <h1 className="my-listings-page__title">My Listings</h1>
        <Link to="/create-listing" className="my-listings-page__add-btn">
          <Plus size={16} /> Add Listing
        </Link>
      </div>

      {error && <p style={{ color: "var(--color-danger)", marginBottom: "1rem" }}>{error}</p>}

      {!loading && (
        <div className="my-listings-page__tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`my-listings-page__tab ${tab === t.key ? "my-listings-page__tab--active" : ""}`}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
              <span className="my-listings-page__tab-count">{t.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--color-text-secondary)" }}>Loading your listings...</p>
      ) : pageListings.length === 0 ? (
        <div className="my-listings-page__empty">
          {allListings.length === 0 ? (
            <p>You haven't listed any properties yet.</p>
          ) : tab === "published" ? (
            <p>None of your listings are published yet. Add a photo to a draft, then publish it.</p>
          ) : tab === "drafts" ? (
            <p>No drafts. A new listing waits here until you add a photo and publish it.</p>
          ) : (
            <p>No unpublished listings.</p>
          )}
        </div>
      ) : (
        <>
          {serverTotal > allListings.length && (
            <p className="my-listings-page__limit-note">
              Showing the first {allListings.length} of {serverTotal} listings.
            </p>
          )}

          <div className="my-listings-page__list">
            {pageListings.map((listing) => (
              <div
                key={listing.id}
                className={`my-listings-page__item ${listing.id === justCreatedId ? "my-listings-page__item--new" : ""}`}
              >
                <div>
                  <p className="my-listings-page__item-title">{listing.title}</p>
                  <p className="my-listings-page__item-address">{listing.address}</p>
                  <div className="my-listings-page__item-meta">
                    <span className="my-listings-page__badge my-listings-page__badge--type">
                      {TYPE_LABELS[listing.type] || "—"}
                    </span>
                    <span
                      className={`my-listings-page__badge my-listings-page__badge--status-${listing.status}`}
                    >
                      {STATUS_LABELS[listing.status] || "—"}
                    </span>
                    {listing.bedrooms != null && <span>{listing.bedrooms} Beds</span>}
                    {listing.bathrooms != null && <span>{listing.bathrooms} Baths</span>}
                  </div>
                  {listing.status === 1 && Array.isArray(listing.media) && listing.media.length === 0 && (
                    <p className="my-listings-page__item-hint">No photo yet — add one to publish.</p>
                  )}
                </div>

                <div className="my-listings-page__item-right">
                  <span className="my-listings-page__price">₦{listing.price.toLocaleString()}</span>
                  <Link
                    to={`/listing-media/${listing.id}`}
                    className="my-listings-page__edit-btn"
                    aria-label="Photos and publishing"
                    title="Photos & publishing"
                  >
                    <ImagePlus size={18} />
                  </Link>
                  <Link
                    to={`/edit-listing/${listing.id}`}
                    className="my-listings-page__edit-btn"
                    aria-label="Edit listing"
                  >
                    <Pencil size={18} />
                  </Link>
                  <button
                    className="my-listings-page__delete-btn"
                    onClick={() => handleDelete(listing.id)}
                    aria-label="Delete listing"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="my-listings-page__pagination">
              <button
                className="my-listings-page__page-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`my-listings-page__page-btn ${page === currentPage ? "my-listings-page__page-btn--active" : ""}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="my-listings-page__page-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MyListingsPage;
