const realApiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const USING_MOCK_API = !realApiUrl;

export const API_BASE_URL = realApiUrl || `${window.location.origin}/mock-api`;

// Fake file-storage address used by the mock for media uploads (the real
// backend hands out real presigned S3 URLs instead).
export const MOCK_STORAGE_URL = `${window.location.origin}/mock-storage`;