/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Upload Configuration — Memory storage + WebP conversion + S3 upload
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Pipeline:
 *    1. Multer receives files into memory (no disk, no direct S3)
 *    2. Sharp converts each file to optimized WebP (in productController)
 *    3. Converted WebP buffers are uploaded to S3 via PutObjectCommand
 *
 *  This replaces the old multer-s3 direct upload which stored original formats.
 */

const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// ── S3 Client ────────────────────────────────────────────────────────────────
const buildS3Client = () => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const config = { region };

  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return new S3Client(config);
};

const s3 = buildS3Client();

// ── File Filter (accept HEIC/HEIF in addition to standard image types) ──────
const fileFilter = (_req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|heic|heif/;
  const allowedMimeTypes = /jpeg|jpg|png|gif|webp|svg|heic|heif/;

  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = String(file.mimetype || '').toLowerCase();

  const extValid = allowedExtensions.test(ext);
  const mimeValid = allowedMimeTypes.test(mime);

  // HEIC files sometimes have empty/generic MIME type from browsers
  const isHeicByExtension = ext === 'heic' || ext === 'heif';

  if (extValid || mimeValid || isHeicByExtension) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG, HEIC, HEIF) are allowed.'));
  }
};

// ── Multer (memory storage — files stay as buffers for Sharp processing) ─────
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB (original can be larger since we'll compress)
});

// ── S3 Upload Helper ─────────────────────────────────────────────────────────
/**
 * Uploads a single WebP buffer to S3 and returns the public URL.
 *
 * @param {Buffer}  buffer      - WebP image buffer
 * @param {string}  fileName    - Desired filename (e.g. "product-abc123.webp")
 * @param {string}  contentType - MIME type (should always be "image/webp")
 * @returns {Promise<string>}   - Public S3 URL
 */
const uploadBufferToS3 = async (buffer, fileName, contentType = 'image/webp') => {
  const bucket = process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  const suffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  const key = `products/product-${suffix}-${fileName}`;

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  // Build the public URL
  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  console.log('[S3Upload] Uploaded WebP image', {
    key,
    size: `${(buffer.length / 1024).toFixed(1)} KB`,
    url,
  });

  return url;
};

/**
 * Batch uploads an array of converted WebP results to S3.
 *
 * @param {Array<{ buffer: Buffer, fileName: string, contentType: string }>} convertedFiles
 * @returns {Promise<string[]>} - Array of public S3 URLs
 */
const uploadConvertedFilesToS3 = async (convertedFiles) => {
  if (!convertedFiles || convertedFiles.length === 0) {
    return [];
  }

  const urls = [];

  for (const file of convertedFiles) {
    const url = await uploadBufferToS3(file.buffer, file.fileName, file.contentType);
    urls.push(url);
  }

  return urls;
};

module.exports = upload;
module.exports.s3 = s3;
module.exports.uploadBufferToS3 = uploadBufferToS3;
module.exports.uploadConvertedFilesToS3 = uploadConvertedFilesToS3;
