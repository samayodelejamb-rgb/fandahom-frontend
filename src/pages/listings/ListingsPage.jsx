import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchListings } from "../../services/listingApi";
import PropertyCard from "../../components/property/PropertyCard";
import FilterPanel, { DEFAULT_FILTERS } from "../../components/property/FilterPanel";
import "./ListingsPage.css";

const HERO_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400";
const PAGE_SIZE = 12; // 3 rows of 4 on desktop
const FETCH_LIMIT = 100; // backend's documented max per request

function ListingsPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  const [allListings, setAllListings] = useState([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  // Re-fetch from the real API whenever search or filters change.
  // Debounced slightly so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1); // new search/filters always start back on page 1
      loadListings();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, appliedFilters]);

  const loadListings = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchListings({
        q: searchTerm || undefined,
        type: appliedFilters.type || undefined,
        tag: appliedFilters.tag || undefined,
        min_price: appliedFilters.minPrice || undefined,
        max_price: appliedFilters.maxPrice || undefined,
        bedrooms: appliedFilters.bedrooms || undefined,
        bathrooms: appliedFilters.bathrooms || undefined,
        swimming_pool: appliedFilters.swimmingPool ? "true" : undefined,
        limit: FETCH_LIMIT,
      });

      setAllListings(sortListings(data.listings, sortBy));
      setServerTotal(data.meta?.total ?? data.listings.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function sortListings(list, sort) {
    const sorted = [...list];
    if (sort === "priceLow") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "priceHigh") sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => b.id - a.id);
    return sorted;
  }

  // Re-sort locally without a fresh fetch when only the sort dropdown changes.
  useEffect(() => {
    setAllListings((prev) => sortListings(prev, sortBy));
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    setAppliedFilters(DEFAULT_FILTERS);
  };

  // Client-side pagination over the already-fetched, already-sorted list.
  // Sorting has to happen across the whole fetched batch before slicing —
  // paginating first would risk showing an unsorted page.
  const totalPages = Math.max(1, Math.ceil(allListings.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageListings = allListings.slice(pageStart, pageStart + PAGE_SIZE);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="listings-page">
      <div className="listings-page__hero">
        <img src={HERO_IMAGE} alt="" className="listings-page__hero-image" />

        <div className="listings-page__hero-inner">
          <h1 className="listings-page__heading">
            Find your
            <br />
            perfect <span className="listings-page__heading-accent">property</span>
          </h1>
          <p className="listings-page__subheading">
            Browse verified properties and find a place you'll love to call home.
          </p>

          <div className="listings-page__hero-search">
            <MapPin size={18} className="listings-page__hero-search-icon" />
            <input
              type="text"
              placeholder="Search by location, property name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="listings-page__hero-search-input"
            />
            <button
              type="button"
              className="listings-page__hero-search-btn"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <SlidersHorizontal size={18} /> Filters
            </button>
          </div>
        </div>
      </div>

      <div className="listings-page__body">
        {showFilters && (
          <FilterPanel
            filters={appliedFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        )}

        <div className="listings-page__toolbar">
          <div className="listings-page__toolbar-heading">
            <h3>All Listings</h3>
            <div className="listings-page__toolbar-underline" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="listings-page__sort"
          >
            <option value="newest">Newest First</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
          </select>
        </div>

        {error && <p className="listings-page__empty">Couldn't load listings: {error}</p>}

        {loading ? (
          <p className="listings-page__empty">Loading listings...</p>
        ) : pageListings.length === 0 ? (
          <p className="listings-page__empty">No properties match your search.</p>
        ) : (
          <>
            {serverTotal > FETCH_LIMIT && (
              <p className="listings-page__limit-note">
                Showing the first {FETCH_LIMIT} of {serverTotal} results. Narrow your
                search or filters to see more specific matches.
              </p>
            )}

            <div className="listings-page__grid">
              {pageListings.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="listings-page__pagination">
                <button
                  className="listings-page__page-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`listings-page__page-btn ${page === currentPage ? "listings-page__page-btn--active" : ""}`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="listings-page__page-btn"
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
    </div>
  );
}

export default ListingsPage;
