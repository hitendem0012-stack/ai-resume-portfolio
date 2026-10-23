/**
 * Profile image pipeline: validate, decode, downscale, encode.
 *
 * Uploaded images are never stored at original size. The stored copy is at
 * most maxOutputDimension pixels on its longest side and at most
 * maxStoredBytes, which keeps the portfolio well inside the localStorage quota.
 *
 * Browsers apply EXIF orientation when an <img> is drawn to a canvas, so
 * phone photos come out upright.
 */

export const IMAGE_LIMITS = {
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxInputBytes: 10 * 1024 * 1024,
  minDimension: 128,
  maxPixels: 50_000_000,
  maxOutputDimension: 1024,
  maxStoredBytes: 500 * 1024,
  quality: 0.85,
};

/** Value for the `accept` attribute of a file input. */
export const IMAGE_ACCEPT = IMAGE_LIMITS.acceptedTypes.join(",");

const MESSAGES = {
  invalid_file: "No image file was provided.",
  empty_file: "The selected file is empty.",
  invalid_type: "Use a JPEG, PNG, or WebP image. Other formats, including GIF, SVG, and HEIC, are not supported.",
  file_too_large: `The image is larger than ${IMAGE_LIMITS.maxInputBytes / (1024 * 1024)} MB. Choose a smaller file.`,
  too_small: `The image is too small. The shorter side must be at least ${IMAGE_LIMITS.minDimension} pixels.`,
  too_many_pixels: "The image dimensions are too large to process. Choose a smaller image.",
  decode_failed: "The image could not be read. The file may be damaged.",
  encode_failed: "The image could not be prepared for saving in this browser.",
  still_too_large: "The image is still too large to store after resizing. Choose a simpler image.",
};

/** Thrown for every expected image failure. `message` is safe to show to the user. */
export class ImageValidationError extends Error {
  constructor(code) {
    super(MESSAGES[code]);
    this.name = "ImageValidationError";
    this.code = code;
  }
}

const ascii = (bytes, start, end) => String.fromCharCode(...bytes.slice(start, end));

/** Identifies the real format from the first bytes, ignoring file name and declared type. */
async function sniffMimeType(blob) {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 4) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Checks that the file is a non-empty JPEG, PNG, or WebP within the size limit.
 * Resolves to { mimeType, bytes } or throws ImageValidationError.
 */
export async function validateImageFile(file) {
  if (!(file instanceof Blob)) throw new ImageValidationError("invalid_file");
  if (file.size === 0) throw new ImageValidationError("empty_file");

  const mimeType = await sniffMimeType(file);
  if (!mimeType) throw new ImageValidationError("invalid_type");
  if (file.size > IMAGE_LIMITS.maxInputBytes) throw new ImageValidationError("file_too_large");

  return { mimeType, bytes: file.size };
}

/** Size in bytes of the binary data behind a base64 data URL. */
export function dataUrlBytes(dataUrl) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ImageValidationError("decode_failed"));
    image.src = url;
  });
}

function encode(image, width, height, outputType) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new ImageValidationError("encode_failed");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  let dataUrl;
  try {
    dataUrl = canvas.toDataURL(outputType, IMAGE_LIMITS.quality);
  } catch {
    throw new ImageValidationError("encode_failed");
  }
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl)) {
    throw new ImageValidationError("encode_failed");
  }
  return dataUrl;
}

/**
 * Downscales a validated image. JPEG stays JPEG. PNG and WebP are written as
 * WebP to keep transparency at a smaller size (a browser without WebP encoding
 * falls back to PNG, which is accepted). Never upscales. If the result is
 * still over maxStoredBytes the dimensions are reduced and it is retried.
 */
export async function resizeImage(file, mimeType) {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (!width || !height) throw new ImageValidationError("decode_failed");
    if (Math.min(width, height) < IMAGE_LIMITS.minDimension) throw new ImageValidationError("too_small");
    if (width * height > IMAGE_LIMITS.maxPixels) throw new ImageValidationError("too_many_pixels");

    const outputType = mimeType === "image/jpeg" ? "image/jpeg" : "image/webp";
    let scale = Math.min(1, IMAGE_LIMITS.maxOutputDimension / Math.max(width, height));

    for (let attempt = 0; attempt < 5; attempt++) {
      const outWidth = Math.max(1, Math.round(width * scale));
      const outHeight = Math.max(1, Math.round(height * scale));
      const dataUrl = encode(image, outWidth, outHeight, outputType);
      const bytes = dataUrlBytes(dataUrl);

      if (bytes <= IMAGE_LIMITS.maxStoredBytes) {
        return { dataUrl, width: outWidth, height: outHeight, bytes };
      }
      scale *= 0.75;
    }
    throw new ImageValidationError("still_too_large");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Full pipeline for a profile image. Resolves to
 * { dataUrl, width, height, bytes, originalBytes } or throws ImageValidationError.
 */
export async function processProfileImage(file) {
  const { mimeType, bytes: originalBytes } = await validateImageFile(file);
  const resized = await resizeImage(file, mimeType);
  return { ...resized, originalBytes };
}
