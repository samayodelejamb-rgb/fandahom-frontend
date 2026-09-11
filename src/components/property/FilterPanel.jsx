import { useState } from "react";
import "./FilterPanel.css";

const TYPES = [
  { value: "", label: "Any" },
  { value: "1", label: "Rent" },
  { value: "2", label: "Sale" },
];

const TAGS = [
  { value: "", label: "Any" },
  { value: "1", label: "New" },
  { value: "2", label: "Hot" },
  { value: "3", label: "Featured" },
];

export const DEFAULT_FILTERS = {
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  bathrooms: "",
  type: "",
  tag: "",
  swimmingPool: false,
};

function FilterPanel({ filters, onApply, onClear }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field, value) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply(localFilters);
  };

  const handleClear = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onClear();
  };

  return (
    <form className="filter-panel" onSubmit={handleSubmit}>
      <div className="filter-panel__grid">
        <div className="filter-panel__group">
          <label>Price Range (₦)</label>
          <div className="filter-panel__range">
            <input
              type="number"
              placeholder="Min"
              className="filter-panel__input"
              value={localFilters.minPrice}
              onChange={(e) => handleChange("minPrice", e.target.value)}
            />
            <input
              type="number"
              placeholder="Max"
              className="filter-panel__input"
              value={localFilters.maxPrice}
              onChange={(e) => handleChange("maxPrice", e.target.value)}
            />
          </div>
        </div>

        <div className="filter-panel__group">
          <label>Listing Type</label>
          <select
            className="filter-panel__select"
            value={localFilters.type}
            onChange={(e) => handleChange("type", e.target.value)}
          >
            {TYPES.map((t) => (
              <option key={t.label} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-panel__group">
          <label>Bedrooms</label>
          <select
            className="filter-panel__select"
            value={localFilters.bedrooms}
            onChange={(e) => handleChange("bedrooms", e.target.value)}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="filter-panel__group">
          <label>Bathrooms</label>
          <select
            className="filter-panel__select"
            value={localFilters.bathrooms}
            onChange={(e) => handleChange("bathrooms", e.target.value)}
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="filter-panel__group">
          <label>Tag</label>
          <select
            className="filter-panel__select"
            value={localFilters.tag}
            onChange={(e) => handleChange("tag", e.target.value)}
          >
            {TAGS.map((t) => (
              <option key={t.label} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-panel__group filter-panel__group--checkbox">
          <label>
            <input
              type="checkbox"
              checked={localFilters.swimmingPool}
              onChange={(e) => handleChange("swimmingPool", e.target.checked)}
            />{" "}
            Has swimming pool
          </label>
        </div>
      </div>

      <div className="filter-panel__actions">
        <button type="submit" className="filter-panel__apply-btn">Apply Filters</button>
        <button type="button" className="filter-panel__clear-btn" onClick={handleClear}>Clear All</button>
      </div>
    </form>
  );
}

export default FilterPanel;
