import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, ChevronRight, CheckCircle2 } from 'lucide-react';

/**
 * CustomizeModal
 *
 * Props:
 *  - product: the current product object (must include customizeColors array)
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onCheckout: (customizationData) => void
 *    customizationData = { bust, waist, hips, length, color: { name, hex } }
 */

const FIELD_META = [
  { key: 'bust',   label: 'Bust',   placeholder: 'e.g. 36' },
  { key: 'waist',  label: 'Waist',  placeholder: 'e.g. 30' },
  { key: 'hips',   label: 'Hips',   placeholder: 'e.g. 38' },
  { key: 'length', label: 'Length', placeholder: 'e.g. 42' },
];

const empty = { bust: '', waist: '', hips: '', length: '' };

const CustomizeModal = ({ product, isOpen, onClose, onCheckout }) => {
  const [measurements, setMeasurements] = useState(empty);
  const [selectedColor, setSelectedColor] = useState(null);
  const [errors, setErrors] = useState({});

  const colors = Array.isArray(product?.customizeColors) ? product.customizeColors : [];

  const set = (key, value) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};
    FIELD_META.forEach(({ key, label }) => {
      const v = Number(measurements[key]);
      if (!measurements[key] || !Number.isFinite(v) || v <= 0) {
        nextErrors[key] = `${label} must be a positive number.`;
      }
    });
    if (colors.length > 0 && !selectedColor) {
      nextErrors.color = 'Please select a color.';
    }
    return nextErrors;
  };

  const handleCheckout = () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onCheckout({
      bust:   Number(measurements.bust),
      waist:  Number(measurements.waist),
      hips:   Number(measurements.hips),
      length: Number(measurements.length),
      color: selectedColor,
    });
  };

  const handleClose = () => {
    setMeasurements(empty);
    setSelectedColor(null);
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="customize-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[9998] bg-black/55 backdrop-blur-[3px]"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="customize-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customize-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 28 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed inset-x-4 bottom-0 top-auto z-[9999] mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-12px_56px_rgba(0,0,0,0.22)] sm:inset-0 sm:m-auto sm:max-h-[90vh] sm:rounded-3xl"
            onKeyDown={(e) => { if (e.key === 'Escape') handleClose(); }}
            tabIndex={-1}
            ref={(el) => { if (el && isOpen) el.focus(); }}
          >
            {/* ── Header ── */}
            <div className="flex shrink-0 items-center justify-between border-b border-black/8 bg-white px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-black to-gray-700 text-white shadow-sm">
                  <Ruler size={17} />
                </span>
                <div>
                  <h2
                    id="customize-modal-title"
                    className="text-[17px] font-extrabold tracking-tight text-foreground"
                  >
                    Customize This Product
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                    All measurements in inches
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close customization panel"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
              {/* Product name chip */}
              {product?.name ? (
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-black/30 bg-gray-50 px-3 py-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-black">
                    {product.name}
                  </span>
                </div>
              ) : null}

              {/* ── Measurement Inputs ── */}
              <p className="mb-3 text-[13px] font-extrabold uppercase tracking-[0.18em] text-foreground">
                Your Measurements
              </p>
              <div className="grid grid-cols-2 gap-3">
                {FIELD_META.map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <label
                      htmlFor={`customize-${key}`}
                      className="block text-[12px] font-bold text-foreground"
                    >
                      {label}
                      <span className="ml-1 text-muted-foreground font-normal">(in)</span>
                    </label>
                    <div className="relative">
                      <input
                        id={`customize-${key}`}
                        type="number"
                        min="1"
                        step="0.5"
                        value={measurements[key]}
                        onChange={(e) => set(key, e.target.value)}
                        placeholder={placeholder}
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 ${
                          errors[key]
                            ? 'border-destructive bg-destructive/5 focus:border-destructive'
                            : 'border-black/12 bg-white focus:border-black'
                        }`}
                      />
                      {measurements[key] && !errors[key] ? (
                        <CheckCircle2
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#03a685]"
                        />
                      ) : null}
                    </div>
                    {errors[key] ? (
                      <p className="text-[11px] text-destructive font-medium">{errors[key]}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* ── Color Selection ── */}
              {colors.length > 0 ? (
                <div className="mt-6">
                  <p className="mb-3 text-[13px] font-extrabold uppercase tracking-[0.18em] text-foreground">
                    Select Color
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => {
                      const isActive = selectedColor?.name === color.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          title={color.name}
                          aria-label={`Select ${color.name}`}
                          onClick={() => {
                            setSelectedColor(color);
                            setErrors((prev) => ({ ...prev, color: undefined }));
                          }}
                          className={`group relative flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-1 rounded-lg`}
                        >
                          {/* Color dot */}
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all ${
                              isActive
                                ? 'ring-2 ring-offset-2 ring-foreground scale-110'
                                : 'ring-1 ring-black/10 hover:ring-foreground/40'
                            }`}
                            style={{ backgroundColor: color.hex || '#888' }}
                          >
                            {isActive ? (
                              <span
                                className="flex h-4 w-4 items-center justify-center rounded-full"
                                style={{
                                  backgroundColor:
                                    color.hex?.toLowerCase() === '#ffffff' || color.hex?.toLowerCase() === '#fff'
                                      ? '#000'
                                      : '#fff',
                                }}
                              >
                                <svg
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  stroke={
                                    color.hex?.toLowerCase() === '#ffffff' || color.hex?.toLowerCase() === '#fff'
                                      ? '#fff'
                                      : '#000'
                                  }
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  width={8}
                                  height={8}
                                >
                                  <path d="M2 6l3 3 5-5" />
                                </svg>
                              </span>
                            ) : null}
                          </span>
                          {/* Label */}
                          <span
                            className={`text-[10px] font-bold capitalize ${
                              isActive ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {color.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.color ? (
                    <p className="mt-2 text-[11px] font-medium text-destructive">{errors.color}</p>
                  ) : null}
                  {selectedColor ? (
                    <p className="mt-2 text-[12px] font-semibold text-foreground">
                      Selected:&nbsp;
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: selectedColor.hex }}
                        />
                        {selectedColor.name}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Note */}
              <p className="mt-5 rounded-xl border border-black/20 bg-gray-50 px-4 py-3 text-[12px] leading-relaxed text-[#8a6a50]">
                <span className="font-bold">Note: </span>
                All measurements should be body measurements (not garment measurements). For the best fit, measure over light clothing.
              </p>
            </div>

            {/* ── Footer CTA ── */}
            <div className="shrink-0 border-t border-black/6 bg-white px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={handleCheckout}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#1a1a1a] to-[#333] py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              >
                Proceed to Checkout
                <ChevronRight size={16} />
              </button>
              <p className="mt-2.5 text-center text-[11px] font-medium text-muted-foreground">
                No extra charge · Uses the same product price
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CustomizeModal;
