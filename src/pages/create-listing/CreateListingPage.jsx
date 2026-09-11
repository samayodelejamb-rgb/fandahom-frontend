import { useNavigate } from "react-router-dom";
import { createListing } from "../../services/listingApi";
import ListingForm from "../../components/listing-form/ListingForm";
import "./CreateListingPage.css";

function CreateListingPage() {
  const navigate = useNavigate();

  const handleCreate = async (payload) => {
    const listing = await createListing(payload);
    setTimeout(() => {
      navigate("/my-listings", { state: { justCreatedId: listing.id } });
    }, 900);
  };

  return (
    <div className="create-listing-page">
      <h1 className="create-listing-page__title">List a Property</h1>
      <p className="create-listing-page__subtitle">
        Fill in the details below to publish a new listing.
      </p>

      <ListingForm
        onSubmit={handleCreate}
        submitLabel="Publish Listing"
        submittingLabel="Publishing..."
        successMessage="Listing created! Redirecting..."
        noteText="Photos and videos are added after the listing is created — you'll be taken to your listing to upload media next."
      />
    </div>
  );
}

export default CreateListingPage;
