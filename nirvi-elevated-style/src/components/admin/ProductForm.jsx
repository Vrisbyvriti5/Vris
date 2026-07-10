import React, { useEffect, useState } from 'react';
import {
  PRODUCT_CATEGORIES,
  isValidCategory,
} from '@/lib/product-taxonomy';

const parseImageInput = (value) => String(value || '')
  .split(/\r?\n|,/)
  .map((entry) => entry.trim())
  .filter(Boolean);

const isHeicLikeFile = (file) => {
  const mimeType = String(file?.type || '').toLowerCase();
  const fileName = String(file?.name || '').toLowerCase();

  return (
    mimeType === 'image/heic'
    || mimeType === 'image/heif'
    || mimeType === 'image/heic-sequence'
    || mimeType === 'image/heif-sequence'
    || fileName.endsWith('.heic')
    || fileName.endsWith('.heif')
  );
};

const inferHeicMimeType = (file) => {
  const mimeType = String(file?.type || '').toLowerCase();
  const fileName = String(file?.name || '').toLowerCase();

  if (mimeType.startsWith('image/heic') || fileName.endsWith('.heic')) {
    return 'image/heic';
  }

  return 'image/heif';
};

const toJpegFileName = (fileName) => {
  const baseName = String(fileName || 'image').replace(/\.[^/.]+$/, '');
  return `${baseName}.jpg`;
};

const toWebpFileName = (fileName) => {
  const baseName = String(fileName || 'image').replace(/\.[^/.]+$/, '');
  return `${baseName}.webp`;
};

/**
 * Converts any image File/Blob to WebP using the Canvas API.
 * Resizes to max 1200px width and compresses at 80% quality.
 */
const convertToWebpViaCanvas = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas WebP conversion failed.'));
          }
          const webpFile = new File(
            [blob],
            toWebpFileName(file.name),
            { type: 'image/webp', lastModified: Date.now() },
          );
          resolve(webpFile);
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for WebP conversion.'));
    };

    img.src = url;
  });
};

const normalizeHeicBlob = async (file, mimeType) => {
  const fileBytes = await file.arrayBuffer();
  return new Blob([fileBytes], { type: mimeType });
};

const loadHeicConverter = async () => {
  const module = await import('heic2any');
  return module.default || module;
};

const loadHeicFallbackConverter = async () => {
  const module = await import('heic-to');
  if (typeof module.heicTo === 'function') {
    return module.heicTo;
  }

  if (module.default && typeof module.default.heicTo === 'function') {
    return module.default.heicTo;
  }

  return null;
};

const toSingleBlob = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const convertHeicToJpegFileWithHeic2Any = async (originalFile, convertHeic) => {
  const inferredMimeType = inferHeicMimeType(originalFile);
  const attemptQueue = [
    () => convertHeic({
      blob: originalFile,
      toType: 'image/jpeg',
      quality: 0.7,
    }),
    async () => {
      const normalizedBlob = await normalizeHeicBlob(originalFile, inferredMimeType);
      return convertHeic({
        blob: normalizedBlob,
        toType: 'image/jpeg',
        quality: 0.7,
      });
    },
    async () => {
      const normalizedBlob = await normalizeHeicBlob(originalFile, 'image/heif');
      return convertHeic({
        blob: normalizedBlob,
        toType: 'image/jpeg',
        quality: 0.7,
      });
    },
  ];

  let lastError;

  for (const runAttempt of attemptQueue) {
    try {
      const converted = await runAttempt();
      const normalizedBlob = toSingleBlob(converted);

      if (!(normalizedBlob instanceof Blob)) {
        throw new Error('Unexpected converter output.');
      }

      return new File(
        [normalizedBlob],
        toJpegFileName(originalFile.name),
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        },
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('HEIC conversion failed.');
};

const convertHeicToJpegFileWithFallback = async (originalFile, convertHeicTo) => {
  const inferredMimeType = inferHeicMimeType(originalFile);
  const attemptQueue = [
    () => convertHeicTo({
      blob: originalFile,
      type: 'image/jpeg',
      quality: 0.7,
    }),
    async () => {
      const normalizedBlob = await normalizeHeicBlob(originalFile, inferredMimeType);
      return convertHeicTo({
        blob: normalizedBlob,
        type: 'image/jpeg',
        quality: 0.7,
      });
    },
    async () => {
      const normalizedBlob = await normalizeHeicBlob(originalFile, 'image/heif');
      return convertHeicTo({
        blob: normalizedBlob,
        type: 'image/jpeg',
        quality: 0.7,
      });
    },
  ];

  let lastError;

  for (const runAttempt of attemptQueue) {
    try {
      const converted = await runAttempt();
      const normalizedBlob = toSingleBlob(converted);

      if (!(normalizedBlob instanceof Blob)) {
        throw new Error('Unexpected fallback converter output.');
      }

      return new File(
        [normalizedBlob],
        toJpegFileName(originalFile.name),
        {
          type: 'image/jpeg',
          lastModified: Date.now(),
        },
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('HEIC fallback conversion failed.');
};

const convertHeicToJpegFile = async ({ originalFile, convertHeic, getFallbackConverter }) => {
  let primaryError;

  if (typeof convertHeic === 'function') {
    try {
      return await convertHeicToJpegFileWithHeic2Any(originalFile, convertHeic);
    } catch (error) {
      primaryError = error;
      console.warn('Primary HEIC conversion failed, trying fallback converter.', error);
    }
  }

  const fallbackConverter = typeof getFallbackConverter === 'function'
    ? await getFallbackConverter()
    : null;

  if (typeof fallbackConverter === 'function') {
    return convertHeicToJpegFileWithFallback(originalFile, fallbackConverter);
  }

  throw primaryError || new Error('HEIC conversion failed.');
};

const clampDiscount = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  if (numeric > 95) return 95;
  return Number(numeric.toFixed(2));
};

const computeFinalPrice = (mrp, discountPercent) => {
  const safeMrp = Number(mrp || 0);
  if (!Number.isFinite(safeMrp) || safeMrp <= 0) return 0;
  const safeDiscount = clampDiscount(discountPercent || 0);
  return Number((safeMrp * (1 - (safeDiscount / 100))).toFixed(2));
};



const createInitialState = (initialValues) => ({
  name: initialValues?.name || '',
  mrp: initialValues?.mrp?.toString() || initialValues?.price?.toString() || '',
  discountPercent: initialValues?.discount_percent?.toString() || '0',
  description: initialValues?.description || '',
  category: initialValues?.category || '',
  stock: initialValues?.stock?.toString() || '',
  imageUrlsText: (
    initialValues?.images?.length
      ? initialValues.images
      : (initialValues?.image ? [initialValues.image] : [])
  ).join('\n'),
  imageFiles: [],
  sizes: initialValues?.sizes || [],
  customizeColors: initialValues?.customizeColors || [],
});

const ProductForm = ({
  mode = 'create',
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState(() => createInitialState(initialValues));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileNames, setSelectedFileNames] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isConvertingImages, setIsConvertingImages] = useState(false);
  const [imageConversionMessage, setImageConversionMessage] = useState('');

  // Only reset the form when navigating to a genuinely different product (by ID).
  // Using the full `initialValues` object as dependency would cause resets on every
  // background refresh, wiping out unsaved edits (the "unselect" glitch).
  const initialProductId = initialValues?.id;
  useEffect(() => {
    setFormData(createInitialState(initialValues));
    setErrors({});
    setSelectedFileNames([]);
    setImageConversionMessage('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProductId]);

  useEffect(() => {
    const previews = (formData.imageFiles || []).map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [formData.imageFiles]);

  const setFieldValue = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };



  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setFieldValue('imageFiles', []);
      setSelectedFileNames([]);
      setImageConversionMessage('');
      return;
    }

    setIsConvertingImages(true);
    setImageConversionMessage('Optimizing images to WebP...');

    try {
      const webpFiles = [];
      const failedConversions = [];
      const hasHeicFile = files.some((file) => isHeicLikeFile(file));
      let convertHeic = null;

      if (hasHeicFile) {
        try {
          convertHeic = await loadHeicConverter();
        } catch (error) {
          console.warn('Unable to load primary HEIC converter.', error);
        }
      }

      let cachedFallbackConverter;
      const getFallbackConverter = async () => {
        if (cachedFallbackConverter !== undefined) {
          return cachedFallbackConverter;
        }
        try {
          cachedFallbackConverter = await loadHeicFallbackConverter();
        } catch (error) {
          console.error('Unable to load HEIC fallback converter.', error);
          cachedFallbackConverter = null;
        }
        return cachedFallbackConverter;
      };

      for (const file of files) {
        // Yield to the main thread to prevent mobile browser UI freezing/crashing
        await new Promise((resolve) => setTimeout(resolve, 50));

        try {
          let intermediateFile = file;

          // Step 1: HEIC → JPG first (canvas can't read HEIC directly)
          if (isHeicLikeFile(file)) {
            intermediateFile = await convertHeicToJpegFile({
              originalFile: file,
              convertHeic,
              getFallbackConverter,
            });
          }

          // Step 2: Any format → WebP via Canvas API
          const webpFile = await convertToWebpViaCanvas(intermediateFile);
          webpFiles.push(webpFile);
        } catch (error) {
          console.error('Image conversion failed:', file.name, error);
          failedConversions.push(file.name);
        }
      }

      setFieldValue('imageFiles', webpFiles);
      setSelectedFileNames(webpFiles.map((file) => file.name));

      if (failedConversions.length > 0) {
        setImageConversionMessage(`Could not convert: ${failedConversions.join(', ')}. Please re-export as JPG or PNG.`);
      } else {
        const totalSaved = files.reduce((sum, f) => sum + f.size, 0) - webpFiles.reduce((sum, f) => sum + f.size, 0);
        const savedKB = Math.max(0, totalSaved / 1024).toFixed(0);
        setImageConversionMessage(`✅ ${webpFiles.length} image(s) optimized to WebP (saved ~${savedKB} KB)`);
      }
    } catch (error) {
      console.error('Image processing failed:', error);
      setFieldValue('imageFiles', []);
      setSelectedFileNames([]);
      setImageConversionMessage('Could not process selected files. Please retry with JPG or PNG files.');
    } finally {
      setIsConvertingImages(false);
      event.target.value = '';
    }
  };

  const handleCategoryChange = (value) => {
    setFormData((current) => {
      return {
        ...current,
        category: value,
      };
    });
  };

  const handleSizeToggle = (size) => {
    setFormData((current) => {
      const sizes = current.sizes || [];
      if (sizes.includes(size)) {
        return { ...current, sizes: sizes.filter(s => s !== size) };
      }
      return { ...current, sizes: [...sizes, size] };
    });
  };

  const handleColorToggle = (color) => {
    setFormData((current) => {
      const colors = current.customizeColors || [];
      const exists = colors.some((c) => c.name === color.name);
      if (exists) {
        return { ...current, customizeColors: colors.filter((c) => c.name !== color.name) };
      }
      return { ...current, customizeColors: [...colors, color] };
    });
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Product name is required.';
    }

    if (!isValidCategory(formData.category)) {
      nextErrors.category = `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}.`;
    }



    if (!formData.description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!formData.mrp || Number(formData.mrp) <= 0) {
      nextErrors.mrp = 'MRP must be greater than zero.';
    }

    const discount = Number(formData.discountPercent);
    if (!Number.isFinite(discount) || discount < 0 || discount > 95) {
      nextErrors.discountPercent = 'Discount must be between 0 and 95.';
    }

    if (formData.stock === '' || Number(formData.stock) < 0) {
      nextErrors.stock = 'Stock quantity must be zero or more.';
    }

    const imageUrls = parseImageInput(formData.imageUrlsText);
    if (mode === 'create' && imageUrls.length === 0 && formData.imageFiles.length === 0) {
      nextErrors.images = 'Please upload images or provide at least one image URL.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const imageUrls = parseImageInput(formData.imageUrlsText);
      const discountPercent = clampDiscount(formData.discountPercent);
      const mrp = Number(formData.mrp);

      await onSubmit({
        ...formData,
        mrp,
        discount_percent: discountPercent,
        stock: Number(formData.stock),
        imageUrls,
        sizes: formData.sizes,
        customizeColors: formData.customizeColors,
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  const previewUrls = parseImageInput(formData.imageUrlsText);
  const allPreviewImages = [...previewUrls, ...filePreviews];
  const finalPrice = computeFinalPrice(formData.mrp, formData.discountPercent);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Product Name</span>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFieldValue('name', event.target.value)}
                placeholder="VRIS Studio Tote"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              />
              {errors.name ? <span className="text-xs text-destructive">{errors.name}</span> : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Category</span>
              <select
                value={formData.category}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              >
                <option value="" disabled>Select a category</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category ? <span className="text-xs text-destructive">{errors.category}</span> : null}
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">MRP</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.mrp}
                onChange={(event) => setFieldValue('mrp', event.target.value)}
                placeholder="999"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              />
              {errors.mrp ? <span className="text-xs text-destructive">{errors.mrp}</span> : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Discount %</span>
              <input
                type="number"
                min="0"
                max="95"
                step="0.1"
                value={formData.discountPercent}
                onChange={(event) => setFieldValue('discountPercent', event.target.value)}
                placeholder="20"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              />
              {errors.discountPercent ? <span className="text-xs text-destructive">{errors.discountPercent}</span> : null}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">Stock Quantity</span>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(event) => setFieldValue('stock', event.target.value)}
                placeholder="18"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              />
              {errors.stock ? <span className="text-xs text-destructive">{errors.stock}</span> : null}
            </label>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">Final Price</p>
            <p className="mt-2 text-lg font-semibold text-foreground">Rs. {finalPrice.toFixed(2)}</p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-foreground">Description</span>
            <textarea
              rows={6}
              value={formData.description}
              onChange={(event) => setFieldValue('description', event.target.value)}
              placeholder="Describe the materials, finish, fit, and product story."
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
            />
            {errors.description ? <span className="text-xs text-destructive">{errors.description}</span> : null}
          </label>

          <div className="space-y-3">
            <span className="text-sm font-semibold text-foreground">Available Sizes</span>
            <div className="flex flex-wrap gap-3">
              {['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL'].map((size) => (
                <label key={size} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={formData.sizes?.includes(size) || false}
                    onChange={() => handleSizeToggle(size)}
                    className="h-4 w-4 rounded border-border text-foreground accent-foreground focus:ring-foreground"
                  />
                  <span className="font-medium">{size}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-body">Select the sizes available for this product.</p>
          </div>

          {/* ── Customize Colors ─────────────────────────────────────────────────── */}
          <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
            <div>
              <span className="text-sm font-semibold text-foreground">Customize Colors</span>
              <p className="mt-1 text-xs text-muted-foreground font-body">
                Select which colors customers can choose when customizing this product. Leave empty to hide the color option.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'Black',  hex: '#1a1a1a' },
                { name: 'White',  hex: '#f5f5f5' },
                { name: 'Red',    hex: '#e53e3e' },
                { name: 'Green',  hex: '#38a169' },
                { name: 'Blue',   hex: '#3b82f6' },
                { name: 'Pink',   hex: '#ec4899' },
                { name: 'Purple', hex: '#8b5cf6' },
                { name: 'Yellow', hex: '#f59e0b' },
                { name: 'Orange', hex: '#f97316' },
                { name: 'Beige',  hex: '#d4b896' },
                { name: 'Navy',   hex: '#1e3a5f' },
                { name: 'Brown',  hex: '#795548' },
                { name: 'Grey',   hex: '#9e9e9e' },
              ].map((color) => {
                const isSelected = (formData.customizeColors || []).some((c) => c.name === color.name);
                return (
                  <button
                    key={color.name}
                    type="button"
                    title={color.name}
                    onClick={() => handleColorToggle(color)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground ${
                      isSelected ? 'bg-foreground/8' : ''
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-all ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                          : 'ring-1 ring-black/15 hover:ring-foreground/40'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {isSelected ? (
                        <svg viewBox="0 0 12 12" fill="none" stroke={color.hex === '#f5f5f5' ? '#000' : '#fff'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={10} height={10}>
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      ) : null}
                    </span>
                    <span className={`text-[10px] font-bold ${ isSelected ? 'text-foreground' : 'text-muted-foreground' }`}>
                      {color.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {(formData.customizeColors || []).length > 0 ? (
              <p className="text-xs font-medium text-foreground">
                Selected:&nbsp;
                {(formData.customizeColors || []).map((c) => c.name).join(', ')}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground font-body">No colors selected — customize button will still show without color options.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Product Images</p>
                <p className="mt-1 text-xs text-muted-foreground font-body">Upload multiple images and/or paste hosted image URLs (one per line).</p>
              </div>
              <input
                type="file"
                accept="image/*,.heic,.heif,.HEIC,.HEIF"
                multiple
                onChange={handleImageUpload}
                className="w-full rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm text-muted-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.24em] file:text-background"
              />
              {isConvertingImages ? <p className="text-xs text-muted-foreground font-body">🔄 Converting images to optimized WebP...</p> : null}
              {selectedFileNames.length > 0 ? <p className="text-xs text-muted-foreground font-body">Ready: {selectedFileNames.join(', ')}</p> : null}
              {imageConversionMessage ? <p className="text-xs text-destructive font-body">{imageConversionMessage}</p> : null}
              <textarea
                rows={4}
                value={formData.imageUrlsText}
                onChange={(event) => setFieldValue('imageUrlsText', event.target.value)}
                placeholder={'https://example.com/image-1.jpg\nhttps://example.com/image-2.jpg'}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-foreground"
              />
              {errors.images ? <span className="text-xs text-destructive">{errors.images}</span> : null}
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-muted/60">
              {allPreviewImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
                  {allPreviewImages.slice(0, 6).map((image, index) => (
                    <img key={`${image}-${index}`} src={image} alt={`${formData.name || 'Product'} preview ${index + 1}`} className="aspect-square w-full rounded-2xl object-cover" />
                  ))}
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center px-6 text-center text-sm text-muted-foreground font-body">
                  Image previews will appear here.
                </div>
              )}
            </div>
          </div>


        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isConvertingImages}
          className="rounded-2xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
        >
          {isConvertingImages ? 'Optimizing to WebP...' : isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;
