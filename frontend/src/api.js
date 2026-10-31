// Where the upload server lives. Set VITE_API_URL when building for production.
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

function uploadError(message) {
  const err = new Error(message);
  err.uploadError = true;
  return err;
}

// Sends a file to the upload server and returns its IPFS hash.
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  let response;
  try {
    response = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
  } catch {
    throw uploadError("Could not reach the upload server. It may be waking up, so try again in a minute.");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw uploadError(body.error || "File upload failed.");
  }

  return (await response.json()).ipfsHash;
}
