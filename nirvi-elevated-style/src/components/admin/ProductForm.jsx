import React, { useEffect, useState } from 'react';
import {
  PRODUCT_CATEGORIES,
  MATERIAL_COLLECTIONS,
  GENDER_COLLECTIONS,
  getCollectionForCategory,
  isValidCategory,
  isValidCollection,
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

const parseMaterialFromCollection = (collectionStr, category) => {
  if (!collectionStr) return getCollectionForCategory(category) || 'Denim';
  const parts = String(collectionStr).split(',').map((c) => c.trim().toLowerCase());
  return MATERIAL_COLLECTIONS.find((m) => parts.includes(m.toLowerCase()))
    || getCollectionForCategory(category)
    || 'Denim';
};

const parseGenderFromCollection = (collectionStr) => {
  if (!collectionStr) return 'Unisex';
  const parts = String(collectionStr).split(',').map((c) => c.trim().toLowerCase());
  return GENDER_COLLECTIONS.find((g) => parts.includes(g.toLowerCase())) || 'Unisex';
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
  materialCollection: parseMaterialFromCollection(initialValues?.collection, initialValues?.category),
  genderCollection: parseGenderFromCollection(initialValues?.collection),
  customizationOptions: {
    colors: initialValues?.customizationOptions?.colors || [],
    styles: initialValues?.customizationOptions?.styles || [],
    addOns: initialValues?.customizationOptions?.addOns || [],
  },
});

const ProductForm = ({
  mode = 'create',
  initialValues,
  customizationOptions,
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

  const toggleCustomizationSelection = (group, option) => {
    setFormData((current) => {
      const values = current.customizationOptions[group] || [];
      const nextValues = values.includes(option)
        ? values.filter((entry) => entry !== option)
        : [...values, option];

      return {
        ...current,
        customizationOptions: {
          ...current.customizationOptions,
          [group]: nextValues,
        },
      };
    });
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
      const suggestedMaterial = getCollectionForCategory(value);
      return {
        ...current,
        category: value,
        // Auto-suggest material collection from category (if not already chosen).
        materialCollection: current.materialCollection || suggestedMaterial || current.materialCollection,
      };
    });
  };

  const selectMaterial = (col) => {
    setFormData((current) => ({
      ...current,
      materialCollection: current.materialCollection === col ? '' : col,
    }));
  };

  const selectGender = (col) => {
    setFormData((current) => ({
      ...current,
      genderCollection: current.genderCollection === col ? '' : col,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Product name is required.';
    }

    if (!isValidCategory(formData.category)) {
      nextErrors.category = `Category must be one of: ${PRODUCT_CATEGORIES.join(', ')}.`;
    }

    if (!formData.materialCollection || !isValidCollection(formData.materialCollection)) {
      nextErrors.materialCollection = 'Please select a material collection (Denim, Wool, or Flex).';
    }

    if (!formData.genderCollection || !isValidCollection(formData.genderCollection)) {
      nextErrors.genderCollection = 'Please select a gender collection (Men, Women, or Unisex).';
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
        collection: [formData.materialCollection, formData.genderCollection].filter(Boolean).join(','),
        mrp,
        discount_percent: discountPercent,
        stock: Number(formData.stock),
        imageUrls,
        imagesFiles: formData.imageFiles,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const customizationGroups = [
    { key: 'colors', label: 'Colors' },
    { key: 'styles', label: 'Styles' },
    { key: 'addOns', label: 'Add-ons' },
  ];

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

            <div className="space-y-4 sm:col-span-2 lg:col-span-4">
              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Material Collection</span>
                <p className="text-[11px] text-muted-foreground font-body">Select one material type</p>
                <div className="flex flex-wrap gap-2">
                  {MATERIAL_COLLECTIONS.map((col) => {
                    const isActive = formData.materialCollection === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => selectMaterial(col)}
                        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                          isActive
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
                {errors.materialCollection ? <span className="text-xs text-destructive">{errors.materialCollection}</span> : null}
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Gender Collection</span>
                <p className="text-[11px] text-muted-foreground font-body">Select one — Unisex will show the product in both Men & Women</p>
                <div className="flex flex-wrap gap-2">
                  {GENDER_COLLECTIONS.map((col) => {
                    const isActive = formData.genderCollection === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => selectGender(col)}
                        className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                          isActive
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
                {errors.genderCollection ? <span className="text-xs text-destructive">{errors.genderCollection}</span> : null}
              </div>
            </div>
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
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
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

          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div>
              <p className="text-sm font-semibold text-foreground">Available Customizations</p>
              <p className="mt-1 text-xs text-muted-foreground font-body">Choose the options shoppers can use for this product.</p>
            </div>

            <div className="mt-5 space-y-4">
              {customizationGroups.map((group) => (
                <div key={group.key}>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{group.label}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(customizationOptions[group.key] || []).map((option) => {
                      const isActive = formData.customizationOptions[group.key]?.includes(option);

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleCustomizationSelection(group.key, option)}
                          className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                            isActive
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
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
