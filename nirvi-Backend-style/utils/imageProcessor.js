/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Image Processor — Convert & optimize all images to WebP using Sharp
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Pipeline: Input (HEIC/JPG/PNG/GIF/WebP) → Resize → WebP @ 80% → Buffer
 *
 *  Sharp natively supports HEIC/HEIF decoding (via libvips), so no separate
 *  heic-convert library is needed on the backend.
 */

const sharp = require('sharp');

// ── Configuration ────────────────────────────────────────────────────────────
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;

/**
 * Detects whether the file is a HEIC/HEIF image based on extension or MIME type.
 *
 * @param {string} originalName - Original filename
 * @param {string} mimeType    - MIME type reported by the client
 * @returns {boolean}
 */
const isHeicFile = (originalName, mimeType) => {
  const ext = String(originalName || '').toLowerCase();
  const mime = String(mimeType || '').toLowerCase();

  return (
    ext.endsWith('.heic')
    || ext.endsWith('.heif')
    || mime === 'image/heic'
    || mime === 'image/heif'
    || mime === 'image/heic-sequence'
    || mime === 'image/heif-sequence'
  );
};

/**
 * Strips the original extension and replaces it with `.webp`.
 *
 * @param {string} originalName - e.g. "photo.heic", "banner.png"
 * @returns {string}            - e.g. "photo.webp", "banner.webp"
 */
const toWebpFileName = (originalName) => {
  const baseName = String(originalName || 'image').replace(/\.[^/.]+$/, '');
  return `${baseName}.webp`;
};

/**
 * Converts any supported image buffer to an optimized WebP buffer.
 *
 * Steps:
 *   1. Load the raw buffer into Sharp
 *   2. Resize down to MAX_WIDTH if wider (preserves aspect ratio)
 *   3. Convert to WebP at WEBP_QUALITY
 *   4. Return the output buffer + metadata
 *
 * @param {Buffer}  inputBuffer  - Raw image bytes (any format Sharp can read)
 * @param {Object}  options
 * @param {string}  options.originalName - Original filename (for logging)
 * @param {string}  options.mimeType    - Original MIME type (for logging)
 * @param {number}  [options.maxWidth]  - Override max width (default 1200)
 * @param {number}  [options.quality]   - Override WebP quality (default 80)
 * @returns {Promise<{ buffer: Buffer, fileName: string, contentType: string, originalSize: number, optimizedSize: number }>}
 */
const convertToWebp = async (inputBuffer, options = {}) => {
  const {
    originalName = 'image',
    mimeType = '',
    maxWidth = MAX_WIDTH,
    quality = WEBP_QUALITY,
  } = options;

  const originalSize = inputBuffer.length;
  const webpFileName = toWebpFileName(originalName);

  const outputBuffer = await sharp(inputBuffer)
    .rotate() // auto-rotate based on EXIF
    .resize({
      width: maxWidth,
      withoutEnlargement: true, // don't upscale small images
    })
    .webp({ quality })
    .toBuffer();

  const savings = originalSize > 0
    ? ((1 - (outputBuffer.length / originalSize)) * 100).toFixed(1)
    : '0.0';

  console.log('[ImageProcessor] Converted to WebP', {
    original: originalName,
    mimeType,
    originalSize: `${(originalSize / 1024).toFixed(1)} KB`,
    optimizedSize: `${(outputBuffer.length / 1024).toFixed(1)} KB`,
    savings: `${savings}%`,
  });

  return {
    buffer: outputBuffer,
    fileName: webpFileName,
    contentType: 'image/webp',
    originalSize,
    optimizedSize: outputBuffer.length,
  };
};

/**
 * Batch-converts an array of multer file objects (memory storage) to WebP.
 *
 * @param {Array<{ buffer: Buffer, originalname: string, mimetype: string }>} files
 * @returns {Promise<Array<{ buffer: Buffer, fileName: string, contentType: string }>>}
 */
const convertFilesToWebp = async (files) => {
  if (!files || files.length === 0) {
    return [];
  }

  const results = [];

  for (const file of files) {
    try {
      const result = await convertToWebp(file.buffer, {
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
      results.push(result);
    } catch (error) {
      console.error('[ImageProcessor] Failed to convert file:', {
        name: file.originalname,
        mimetype: file.mimetype,
        error: error.message,
      });
      // Skip files that can't be converted rather than failing the whole batch
    }
  }

  return results;
};

module.exports = {
  isHeicFile,
  toWebpFileName,
  convertToWebp,
  convertFilesToWebp,
  MAX_WIDTH,
  WEBP_QUALITY,
};
