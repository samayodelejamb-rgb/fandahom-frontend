import { useState } from "react";
import "./FilterPanel.css";

const PROPERTY_TYPES = ["Duplex", "Apartment", "Bungalow", "Detached House"];

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
    const cleared = {
      minPrice: "",
      maxPrice: "",
      beds: "",
      baths: "",
      minSqm: "",
      maxSqm: "",
      propertyType: "",
    };
    setLocalFilters(cleared);
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
          <label>Bedrooms</label>
          <select
            className="filter-panel__select"
            value={localFilters.beds}
            onChange={(e) => handleChange("beds", e.target.value)}
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>

        <div className="filter-panel__group">
          <label>Bathrooms</label>
          <select
            className="filter-panel__select"
            value={localFilters.baths}
            onChange={(e) => handleChange("baths", e.target.value)}
          >
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>

        <div className="filter-panel__group">
          <label>Property Type</label>
          <select
            className="filter-panel__select"
            value={localFilters.propertyType}
            onChange={(e) => handleChange("propertyType", e.target.value)}
          >
            <option value="">Any</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="filter-panel__group">
          <label>Size (sqm)</label>
          <div className="filter-panel__range">
            <input
              type="number"
              placeholder="Min"
              className="filter-panel__input"
              value={localFilters.minSqm}
              onChange={(e) => handleChange("minSqm", e.target.value)}
            />
            <input
              type="number"
              placeholder="Max"
              className="filter-panel__input"
              value={localFilters.maxSqm}
              onChange={(e) => handleChange("maxSqm", e.target.value)}
            />
          </div>
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