import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchListing, updateListing } from "../../services/listingApi";
import ListingForm, { listingToFormValues } from "../../components/listing-form/ListingForm";
import "../create-listing/CreateListingPage.css"; // reuses the same page-wrapper styles

function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchListing(id);
        if (!cancelled) setListing(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (payload) => {
    await updateListing(id, payload);
    setTimeout(() => {
      navigate("/my-listings", { state: { justCreatedId: Number(id) } });
    }, 900);
  };

  if (loading) {
    return <p style={{ padding: "3rem", textAlign: "center" }}>Loading listing...</p>;
  }

  if (error || !listing) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p>{error || "Listing not found."}</p>
        <Link to="/my-listings">Back to My Listings</Link>
      </div>
    );
  }

  return (
    <div className="create-listing-page">
      <h1 className="create-listing-page__title">Edit Listing</h1>
      <p className="create-listing-page__subtitle">
        Update the details for "{listing.title}".
      </p>

      <ListingForm
        initialValues={listingToFormValues(listing)}
        onSubmit={handleUpdate}
        submitLabel="Save Changes"
        submittingLabel="Saving..."
        successMessage="Listing updated! Redirecting..."
      />
    </div>
  );
}

export default EditListingPage;
