// SVG is deliberately excluded: it can embed scripts (stored-XSS vector).
export const MIME_IMAGE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/tiff",
];

export const MIME_VIDEO = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

export const MIME_AUDIO = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/aac",
  "audio/flac",
  "audio/midi",
];

export const MIME_DOCS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
];

export interface ValidateFileOptions {
  maxSize?: number; // in bytes, e.g. 5 * 1024 * 1024 for 5MB
  allowedMimeTypes?: string[]; // e.g. ["image/jpeg", "image/png", "image/gif", "image/webp"]
}

// MIME checks sniff the actual file content (magic bytes) rather than
// trusting the client-supplied Blob.type, so allowedMimeTypes only works
// for binary formats with a signature (images, video, audio, pdf/office —
// not text/plain or text/csv).
export async function validateFile(
  file: Blob,
  options: ValidateFileOptions = {},
): Promise<{ isValid: boolean; error?: string; mime?: string }> {
  if (!file || !(file instanceof Blob)) {
    return { isValid: false, error: "Invalid file object" };
  }

  const { maxSize, allowedMimeTypes } = options;

  // Validate size
  if (maxSize && file.size > maxSize) {
    const sizeInMb = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size exceeds the limit of ${sizeInMb}MB`,
    };
  }

  // Validate MIME type from file content
  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    const { fileTypeFromBuffer } = await import("file-type");
    const sniffed = await fileTypeFromBuffer(
      new Uint8Array(await file.arrayBuffer()),
    );

    if (!sniffed || !allowedMimeTypes.includes(sniffed.mime)) {
      // Create a clean display version of MIME types
      const friendlyTypes = allowedMimeTypes.map(
        (type) => type.split("/")[1] || type,
      );
      return {
        isValid: false,
        error: `Invalid file type. Allowed types are: ${friendlyTypes.join(", ")}`,
      };
    }

    return { isValid: true, mime: sniffed.mime };
  }

  return { isValid: true };
}
