import { useNavigate } from "react-router-dom";
import { createListing } from "../../services/listingApi";
import ListingForm from "../../components/listing-form/ListingForm";
import "./CreateListingPage.css";

function CreateListingPage() {
  const navigate = useNavigate();

  // Step 1 of 2: save the details. The backend creates the listing as a
  // DRAFT (not public yet). Publishing happens on the next page, after
  // at least one image has been uploaded.
  const handleCreate = async (payload) => {
    const listing = await createListing(payload);
    setTimeout(() => {
      navigate(`/listing-media/${listing.id}`);
    }, 900);
  };

  return (
    <div className="create-listing-page">
      <h1 className="create-listing-page__title">List a Property</h1>
      <p className="create-listing-page__subtitle">
        Step 1 of 2 — fill in the details below, then add photos.
      </p>

      <ListingForm
        onSubmit={handleCreate}
        submitLabel="Next"
        submittingLabel="Saving..."
        successMessage="Details saved! Taking you to photos..."
        noteText="Your listing is saved as a draft. It goes live only after you add at least one photo and publish it on the next page."
      />
    </div>
  );
}

export default CreateListingPage;
