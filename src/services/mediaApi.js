import { apiRequest } from "./apiClient";

// Limits and allowed types, straight from the API doc's reference table.
// We check these in the browser BEFORE calling the backend so users get an
// instant, friendly error instead of a failed request. The backend still
// enforces them too — never rely on the frontend check alone.
export const MEDIA_RULES = {
  image: {
    mimes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 20 * 1024 * 1024,
    label: "JPG, PNG or WebP up to 20 MB",
  },
  video: {
    mimes: ["video/mp4", "video/quicktime", "video/webm"],
    maxBytes: 2 * 1024 * 1024 * 1024,
    label: "MP4, MOV or WebM up to 2 GB",
  },
  document: {
    mimes: ["application/pdf"],
    maxBytes: 50 * 1024 * 1024,
    label: "PDF up to 50 MB",
  },
};

/**
 * Work out media_type ("image" | "video" | "document") from a File and
 * check it against the rules above. Returns { mediaType } on success or
 * { error } with a message you can show the user.
 */
export function validateFile(file) {
  const mediaType = Object.keys(MEDIA_RULES).find((type) =>
    MEDIA_RULES[type].mimes.includes(file.type)
  );

  if (!mediaType) {
    return { error: `"${file.name}" is not a supported file type.` };
  }
  if (file.size > MEDIA_RULES[mediaType].maxBytes) {
    return { error: `"${file.name}" is too large. Allowed: ${MEDIA_RULES[mediaType].label}.` };
  }
  return { mediaType };
}

// ---------------------------------------------------------------------
// The three steps of the upload flow, one function each
// ---------------------------------------------------------------------

/**
 * Step 1 — POST /media/init/
 * Tells the backend what we're about to upload. Returns
 * { media_id, upload_url, file_key, expires_in }.
 *
 * @param {"listing"|"user"} ownerType
 * @param {number} ownerId
 */
export async function initUpload({ ownerType, ownerId, mediaType, file }) {
  return apiRequest("/media/init/", {
    method: "POST",
    body: {
      owner_type: ownerType,
      owner_id: ownerId,
      media_type: mediaType,
      mime_type: file.type,
      file_size: file.size,
      file_name: file.name,
    },
  });
}

/**
 * Step 2 — PUT the file bytes straight to the presigned URL.
 *
 * This deliberately does NOT use apiRequest(): the URL is on S3, not our
 * backend, so we must not send our cookies or CSRF header (the doc says
 * the presigned URL already carries all the credentials). The
 * Content-Type must exactly match what we declared in initUpload.
 */
export async function uploadToStorage(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
    credentials: "omit",
  });

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}). Please try again.`);
  }
}

/**
 * Step 3 — POST /media/confirm/
 * Tells the backend the upload finished so it can start virus-scanning.
 * Returns the media object (state will be "pending_scan").
 */
export async function confirmUpload(mediaId) {
  const data = await apiRequest("/media/confirm/", {
    method: "POST",
    body: { media_id: mediaId },
  });
  return data.media;
}

// ---------------------------------------------------------------------
// Reading / deleting
// ---------------------------------------------------------------------

export async function fetchMedia(mediaId) {
  const data = await apiRequest(`/media/${mediaId}/`);
  return data.media;
}

export async function deleteMedia(mediaId) {
  await apiRequest(`/media/${mediaId}/`, { method: "DELETE" });
}

/**
 * Keep asking the backend until the file has finished processing.
 * States move: pending_scan -> scanning -> ready (videos also pass through
 * pending_transcode -> transcoding). "infected" and "failed" are dead ends.
 *
 * @param {(media: object) => void} [onUpdate] called on every poll, so the
 *   UI can show "Scanning...", "Processing video...", etc.
 */
export async function pollUntilReady(
  mediaId,
  { intervalMs = 1000, maxAttempts = 120, onUpdate } = {}
) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const media = await fetchMedia(mediaId);
    if (onUpdate) onUpdate(media);

    if (media.state === "ready") return media;
    if (media.state === "infected") {
      throw new Error("This file was rejected by the virus scan.");
    }
    if (media.state === "failed") {
      throw new Error("Processing failed. Please upload the file again.");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Processing is taking too long. Please try again later.");
}

// ---------------------------------------------------------------------
// The one function your UI will normally call
// ---------------------------------------------------------------------

/**
 * Full upload: validate -> init -> PUT to storage -> confirm -> wait until
 * ready. Resolves with the finished media object (with a usable `url`).
 * Throws an Error with a user-friendly message if any step fails.
 *
 * @param {(update: { stage: string, media?: object }) => void} [onProgress]
 *   stages: "validating" | "starting" | "uploading" | "confirming" |
 *           "processing" (with `media` attached) | "done"
 */
export async function uploadMedia({ ownerType, ownerId, file, onProgress }) {
  const report = (update) => onProgress && onProgress(update);

  report({ stage: "validating" });
  const check = validateFile(file);
  if (check.error) throw new Error(check.error);

  report({ stage: "starting" });
  const { media_id, upload_url } = await initUpload({
    ownerType,
    ownerId,
    mediaType: check.mediaType,
    file,
  });

  report({ stage: "uploading" });
  await uploadToStorage(upload_url, file);

  report({ stage: "confirming" });
  await confirmUpload(media_id);

  const ready = await pollUntilReady(media_id, {
    onUpdate: (media) => report({ stage: "processing", media }),
  });

  report({ stage: "done", media: ready });
  return ready;
}
