import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ImagePlus, Trash2, X } from "lucide-react";
import {
  fetchListing,
  fetchListingMedia,
  publishListing,
  unpublishListing,
} from "../../services/listingApi";
import { uploadMedia, deleteMedia, validateFile, MEDIA_RULES } from "../../services/mediaApi";
import "./ListingMediaPage.css";

// Listing status values from the API doc.
const STATUS_LABELS = { 1: "Draft", 2: "Published", 3: "Unpublished" };

// This page accepts photos and videos (the two media types in the API doc).
const ACCEPT = [...MEDIA_RULES.image.mimes, ...MEDIA_RULES.video.mimes].join(",");

// Turn the progress updates from uploadMedia() into text for the user.
function stageLabel(update) {
  switch (update.stage) {
    case "validating":
    case "starting":
      return "Preparing...";
    case "uploading":
      return "Uploading...";
    case "confirming":
      return "Finishing upload...";
    case "processing": {
      const state = update.media?.state;
      if (state === "pending_scan") return "Waiting to be scanned...";
      if (state === "scanning") return "Scanning for viruses...";
      if (state === "pending_transcode" || state === "transcoding") return "Processing video...";
      return "Processing...";
    }
    default:
      return "Working...";
  }
}

// Processing states from the API doc that are still "in progress".
const PROCESSING_STATES = ["pending_scan", "scanning", "pending_transcode", "transcoding"];

// Turns a media object from GET /listing/<id>/media/ into a tile.
function mediaToItem(m) {
  if (m.state === "ready") {
    return { key: `existing-${m.id}`, name: m.file_name, status: "ready", label: "", media: m, error: "" };
  }
  if (m.state === "infected" || m.state === "failed") {
    return {
      key: `existing-${m.id}`,
      name: m.file_name,
      status: "error",
      label: "",
      media: m,
      error:
        m.state === "infected"
          ? "Rejected by the virus scan."
          : "Processing failed. Remove it and upload again.",
    };
  }
  return {
    key: `existing-${m.id}`,
    name: m.file_name,
    status: "working",
    label: stageLabel({ stage: "processing", media: m }),
    media: m,
    error: "",
  };
}

function ListingMediaPage() {
  const { id } = useParams();
  const listingId = Number(id);
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // One entry per file the user has added on this page:
  // { key, name, status: "working" | "ready" | "error", label, media, error }
  const [items, setItems] = useState([]);

  const [busy, setBusy] = useState(false); // publishing / unpublishing
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Load the listing (the owner can see it even while it's a draft).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPageLoading(true);
      setPageError("");
      try {
        const [data, media] = await Promise.all([
          fetchListing(listingId),
          // Owner sees every item in any state (per the API doc).
          fetchListingMedia(listingId),
        ]);
        if (cancelled) return;
        setListing(data);
        setItems(media.map(mediaToItem));
      } catch (err) {
        if (!cancelled) setPageError(err.message);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  // Files uploaded earlier that were still processing when the page opened
  // (e.g. after a refresh): re-check the listing's media every 3 seconds
  // until they finish.
  const stillProcessing = items.some(
    (it) => it.key.startsWith("existing-") && PROCESSING_STATES.includes(it.media?.state)
  );
  useEffect(() => {
    if (!stillProcessing) return undefined;

    const timer = setInterval(async () => {
      try {
        const fresh = await fetchListingMedia(listingId);
        setItems((prev) =>
          prev.map((it) => {
            if (!it.key.startsWith("existing-")) return it;
            const latest = fresh.find((m) => m.id === it.media?.id);
            return latest ? mediaToItem(latest) : it;
          })
        );
      } catch {
        /* try again on the next tick */
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [stillProcessing, listingId]);

  const updateItem = (key, changes) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...changes } : it)));
  };

  const uploadOne = async (file) => {
    const key = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const check = validateFile(file);

    if (check.error) {
      setItems((prev) => [
        ...prev,
        {
          key,
          name: file.name,
          status: "error",
          label: "",
          media: null,
          error: check.error,
        },
      ]);
      return;
    }

    setItems((prev) => [
      ...prev,
      { key, name: file.name, status: "working", label: "Preparing...", media: null, error: "" },
    ]);

    try {
      const media = await uploadMedia({
        ownerType: "listing",
        ownerId: listingId,
        file,
        onProgress: (update) => updateItem(key, { label: stageLabel(update) }),
      });
      updateItem(key, { status: "ready", label: "", media });
    } catch (err) {
      updateItem(key, { status: "error", label: "", error: err.message });
    }
  };

  const handleFilesChosen = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // lets the user pick the same file again later
    if (files.length === 0) return;

    setActionError("");
    setActionSuccess("");

    // One after another, so the display order matches the order chosen.
    for (const file of files) {
      await uploadOne(file);
    }
  };

  const handleRemove = async (item) => {
    // Failed files were never stored, so just drop them from the list.
    if (item.status === "error") {
      setItems((prev) => prev.filter((it) => it.key !== item.key));
      return;
    }

    if (!window.confirm("Remove this file from the listing?")) return;
    setActionError("");
    try {
      await deleteMedia(item.media.id);
      setItems((prev) => prev.filter((it) => it.key !== item.key));

      // A live listing needs an image. If this was its last one, the
      // backend may move it back to draft, so refresh the status shown.
      if (listing.status === 2) {
        try {
          setListing(await fetchListing(listingId));
        } catch {
          /* the delete worked; a failed refresh isn't worth an error */
        }
      }
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    setActionError("");
    setActionSuccess("");
    try {
      await publishListing(listingId);
      setListing((prev) => ({ ...prev, status: 2 }));
      setActionSuccess("Your listing is live! Taking you to My Listings...");
      setTimeout(() => {
        navigate("/my-listings", { state: { justCreatedId: listingId, tab: "published" } });
      }, 1200);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublish = async () => {
    setBusy(true);
    setActionError("");
    setActionSuccess("");
    try {
      await unpublishListing(listingId);
      setListing((prev) => ({ ...prev, status: 3 }));
      setActionSuccess("Listing unpublished. It's now hidden from public browse.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (pageLoading) {
    return <p style={{ padding: "3rem", textAlign: "center" }}>Loading listing...</p>;
  }

  if (pageError || !listing) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <p>{pageError || "Listing not found."}</p>
        <Link to="/my-listings">Back to My Listings</Link>
      </div>
    );
  }

  const isPublished = listing.status === 2;
  // Which My Listings tab this listing belongs to (for the links below).
  const backTab = listing.status === 2 ? "published" : listing.status === 3 ? "unpublished" : "drafts";
  const uploading = items.some((it) => it.status === "working");
  const readyImages = items.filter(
    (it) => it.status === "ready" && it.media?.media_type === "image"
  ).length;
  const canPublish = readyImages > 0 && !uploading && !busy;

  return (
    <div className="listing-media-page">
      <Link
        to="/my-listings"
        state={{ tab: backTab }}
        className="listing-media-page__back"
      >
        <ArrowLeft size={16} /> My Listings
      </Link>

      <h1 className="listing-media-page__title">Add Photos &amp; Videos</h1>
      <p className="listing-media-page__subtitle">
        {isPublished ? "" : "Step 2 of 2 — "}
        for &quot;{listing.title}&quot;
      </p>

      <div className="listing-media-page__card">
        <div className="listing-media-page__card-header">
          <h2>Media</h2>
          <span
            className={`listing-media-page__status listing-media-page__status--${listing.status}`}
          >
            {STATUS_LABELS[listing.status] || "Unknown"}
          </span>
        </div>

        <label className="listing-media-page__dropzone">
          <ImagePlus size={28} />
          <span className="listing-media-page__dropzone-title">Choose photos or videos</span>
          <span className="listing-media-page__dropzone-hint">
            {MEDIA_RULES.image.label} &middot; {MEDIA_RULES.video.label}
          </span>
          <input
            type="file"
            accept={ACCEPT}
            multiple
            onChange={handleFilesChosen}
            className="listing-media-page__file-input"
          />
        </label>

        {items.length === 0 ? (
          <p className="listing-media-page__empty">No photos yet. Add at least one to publish.</p>
        ) : (
          <div className="listing-media-page__grid">
            {items.map((item) => (
              <div key={item.key} className="listing-media-page__tile">
                <div className="listing-media-page__thumb">
                  {item.status === "ready" && item.media?.url ? (
                    item.media.media_type === "video" ? (
                      <video src={item.media.url} muted preload="metadata" />
                    ) : (
                      <img src={item.media.url} alt={item.name} />
                    )
                  ) : item.status === "error" ? (
                    <p className="listing-media-page__tile-error">{item.error}</p>
                  ) : (
                    <p className="listing-media-page__tile-working">{item.label}</p>
                  )}

                  {item.status === "ready" && item.media?.is_cover && (
                    <span className="listing-media-page__cover-pill">Cover</span>
                  )}

                  {item.status !== "working" && (
                    <button
                      type="button"
                      className="listing-media-page__remove-btn"
                      onClick={() => handleRemove(item)}
                      aria-label={item.status === "error" ? "Dismiss" : "Remove file"}
                    >
                      {item.status === "error" ? <X size={14} /> : <Trash2 size={14} />}
                    </button>
                  )}
                </div>
                <p className="listing-media-page__filename">{item.name}</p>
              </div>
            ))}
          </div>
        )}

        {actionError && <p className="listing-media-page__error">{actionError}</p>}
        {actionSuccess && <p className="listing-media-page__success">{actionSuccess}</p>}

        <div className="listing-media-page__actions">
          {isPublished ? (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={busy}
              className="listing-media-page__secondary-btn"
            >
              {busy ? "Unpublishing..." : "Unpublish"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish}
              className="listing-media-page__primary-btn"
            >
              {busy ? "Publishing..." : "Publish Listing"}
            </button>
          )}

          <Link
            to="/my-listings"
            state={{ tab: backTab }}
            className="listing-media-page__later-link"
          >
            {isPublished ? "Done" : "Finish later"}
          </Link>
        </div>

        {!isPublished && !canPublish && !busy && (
          <p className="listing-media-page__hint">
            {uploading
              ? "Hang on — your files are still being processed."
              : "Add at least one photo and wait until it finishes processing to publish."}
          </p>
        )}
      </div>
    </div>
  );
}

export default ListingMediaPage;
