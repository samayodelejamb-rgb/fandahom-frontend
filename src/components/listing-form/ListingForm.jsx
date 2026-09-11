import { useState } from "react";
import "./ListingForm.css";

const LISTING_TYPES = [
  { value: 1, label: "Rent" },
  { value: 2, label: "Sale" },
];

const LISTING_TAGS = [
  { value: "", label: "None" },
  { value: 1, label: "New" },
  { value: 2, label: "Hot" },
  { value: 3, label: "Featured" },
];

const BLANK_FORM = {
  title: "",
  price: "",
  address: "",
  type: "",
  description: "",
  tag: "",
  bedrooms: "",
  bathrooms: "",
  swimmingPool: false,
};

/**
 * Converts a real Listing object (from the API) into the shape this
 * form's inputs expect. Used by EditListingPage to pre-fill the form.
 */
export function listingToFormValues(listing) {
  return {
    title: listing.title || "",
    price: listing.price != null ? String(listing.price) : "",
    address: listing.address || "",
    type: listing.type != null ? String(listing.type) : "",
    description: listing.description || "",
    tag: listing.tag != null ? String(listing.tag) : "",
    bedrooms: listing.bedrooms != null ? String(listing.bedrooms) : "",
    bathrooms: listing.bathrooms != null ? String(listing.bathrooms) : "",
    swimmingPool: !!listing.swimming_pool,
  };
}

/**
 * Converts this form's values into the payload shape the API expects
 * for POST /listing/ or PATCH /listing/<id>/.
 */
function formValuesToPayload(form) {
  return {
    title: form.title.trim(),
    price: Number(form.price),
    address: form.address.trim(),
    type: Number(form.type),
    description: form.description.trim() || undefined,
    tag: form.tag ? Number(form.tag) : undefined,
    bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
    swimming_pool: form.swimmingPool,
  };
}

function ListingForm({
  initialValues,
  onSubmit,
  submitLabel = "Publish Listing",
  submittingLabel = "Saving...",
  successMessage = "Saved! Redirecting...",
  noteText,
}) {
  const [form, setForm] = useState(initialValues || BLANK_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.title.trim() || !form.price || !form.address.trim() || !form.type) {
      setError("Title, price, address, and type are required.");
      return;
    }
    if (Number(form.price) < 0) {
      setError("Price cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formValuesToPayload(form));
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="listing-form__card">
      <form onSubmit={handleSubmit} className="listing-form__form">
        <div className="listing-form__field">
          <label>Title <span className="required">*</span></label>
          <input
            type="text"
            maxLength={255}
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="listing-form__input"
            placeholder="e.g. 3 Bedroom Flat in Lekki Phase 1"
          />
        </div>

        <div className="listing-form__row">
          <div className="listing-form__field">
            <label>Price (₦) <span className="required">*</span></label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="listing-form__input"
              placeholder="4500000"
            />
          </div>

          <div className="listing-form__field">
            <label>Listing Type <span className="required">*</span></label>
            <select
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="listing-form__select"
            >
              <option value="">Select type</option>
              {LISTING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="listing-form__field">
          <label>Address <span className="required">*</span></label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className="listing-form__input"
            placeholder="14 Admiralty Way, Lekki Phase 1, Lagos"
          />
        </div>

        <div className="listing-form__field">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="listing-form__textarea"
            placeholder="Newly renovated, en-suite bathrooms, 24/7 power..."
          />
        </div>

        <div className="listing-form__row">
          <div className="listing-form__field">
            <label>Bedrooms</label>
            <input
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={(e) => handleChange("bedrooms", e.target.value)}
              className="listing-form__input"
            />
          </div>

          <div className="listing-form__field">
            <label>Bathrooms</label>
            <input
              type="number"
              min="0"
              value={form.bathrooms}
              onChange={(e) => handleChange("bathrooms", e.target.value)}
              className="listing-form__input"
            />
          </div>
        </div>

        <div className="listing-form__field">
          <label>Tag</label>
          <select
            value={form.tag}
            onChange={(e) => handleChange("tag", e.target.value)}
            className="listing-form__select"
          >
            {LISTING_TAGS.map((t) => (
              <option key={t.label} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <label className="listing-form__checkbox-row">
          <input
            type="checkbox"
            checked={form.swimmingPool}
            onChange={(e) => handleChange("swimmingPool", e.target.checked)}
          />
          Has a swimming pool
        </label>

        {error && <p className="listing-form__error">{error}</p>}
        {success && <p className="listing-form__success">{successMessage}</p>}

        <button type="submit" disabled={loading} className="listing-form__submit-btn">
          {loading ? submittingLabel : submitLabel}
        </button>

        {noteText && <p className="listing-form__note">{noteText}</p>}
      </form>
    </div>
  );
}

export default ListingForm;
