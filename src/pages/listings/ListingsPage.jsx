import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { mockProperties } from "../../mocks/mockProperties";
import PropertyCard from "../../components/property/PropertyCard";
import FilterPanel from "../../components/property/FilterPanel";
import "./ListingsPage.css";

const DEFAULT_FILTERS = {
  minPrice: "",
  maxPrice: "",
  beds: "",
  baths: "",
  minSqm: "",
  maxSqm: "",
  propertyType: "",
};

function ListingsPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  // Keep the page's search box in sync if someone searches again from the Navbar
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const filteredAndSorted = useMemo(() => {
    let result = mockProperties.filter((property) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        property.title.toLowerCase().includes(term) ||
        property.location.toLowerCase().includes(term);

      const matchesMinPrice = !appliedFilters.minPrice || property.price >= Number(appliedFilters.minPrice);
      const matchesMaxPrice = !appliedFilters.maxPrice || property.price <= Number(appliedFilters.maxPrice);
      const matchesBeds = !appliedFilters.beds || property.beds >= Number(appliedFilters.beds);
      const matchesBaths = !appliedFilters.baths || property.baths >= Number(appliedFilters.baths);
      const matchesMinSqm = !appliedFilters.minSqm || property.sqm >= Number(appliedFilters.minSqm);
      const matchesMaxSqm = !appliedFilters.maxSqm || property.sqm <= Number(appliedFilters.maxSqm);
      const matchesType = !appliedFilters.propertyType || property.details.propertyType === appliedFilters.propertyType;

      return (
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesBeds &&
        matchesBaths &&
        matchesMinSqm &&
        matchesMaxSqm &&
        matchesType
      );
    });

    if (sortBy === "priceLow") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceHigh") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result = [...result].sort((a, b) => b.id - a.id);
    }

    return result;
  }, [searchTerm, sortBy, appliedFilters]);

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    setAppliedFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="listings-page">
      <h1 className="listings-page__heading">Find your perfect property</h1>
      <p className="listings-page__subheading">
        Browse verified properties and find a place you'll love to call home.
      </p>

      <div className="listings-page__search-row">
        <input
          type="text"
          placeholder="Search by location, property name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="listings-page__search-input"
        />
        <button
          className="listings-page__filters-btn"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          Filters
        </button>
      </div>

      {showFilters && (
        <FilterPanel
          filters={appliedFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
        />
      )}

      <div className="listings-page__toolbar">
        <h3>All Listings</h3>
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

      {filteredAndSorted.length === 0 ? (
        <p className="listings-page__empty">No properties match your search.</p>
      ) : (
        <div className="listings-page__grid">
          {filteredAndSorted.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ListingsPage;