import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const sanitizePhone = (value) => String(value || '').replace(/\D/g, '');

const configuredPhone = sanitizePhone(import.meta.env.VITE_WHATSAPP_NUMBER);
const fallbackPhone = '919671300024';
const whatsappPhone = configuredPhone || fallbackPhone;

const BASE_BOTTOM = 20; // px — matches the original bottom-5
const BASE_BOTTOM_SM = 24; // px — matches the original sm:bottom-6

const FloatingWhatsAppButton = () => {
  const [offset, setOffset] = useState(0);

  // Listen to the CSS custom property --wa-offset set by ProductDetail's sticky bar
  useEffect(() => {
    const root = document.documentElement;

    const read = () => {
      const raw = getComputedStyle(root).getPropertyValue('--wa-offset').trim();
      setOffset(raw ? parseInt(raw, 10) || 0 : 0);
    };

    read(); // initial

    // MutationObserver watches for style attribute changes on <html>
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['style'] });

    return () => observer.disconnect();
  }, []);

  const bottomPx = BASE_BOTTOM + offset;
  const bottomSmPx = BASE_BOTTOM_SM + offset;

  return (
    <motion.a
      href={`https://wa.me/${whatsappPhone}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with VRIS on WhatsApp"
      className="fixed right-5 z-[45] inline-flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-[#25D366] text-black shadow-[0_14px_34px_rgba(0,0,0,0.22)] hover:shadow-[0_18px_38px_rgba(37,211,102,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:right-6"
      style={{
        bottom: `${bottomPx}px`,
        transition: 'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      initial={{ opacity: 0, y: 18, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
        <path d="M19.05 4.91A9.82 9.82 0 0 0 12.05 2c-5.45 0-9.89 4.44-9.89 9.89 0 1.74.45 3.44 1.31 4.95L2 22l5.33-1.4a9.9 9.9 0 0 0 4.72 1.2h.01c5.45 0 9.89-4.44 9.89-9.89a9.82 9.82 0 0 0-2.9-7zM12.06 20.1h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.17.83.85-3.09-.2-.32a8.19 8.19 0 0 1-1.27-4.39c0-4.52 3.68-8.2 8.22-8.2 2.2 0 4.26.86 5.81 2.41a8.17 8.17 0 0 1 2.4 5.82c0 4.53-3.68 8.21-8.2 8.21zm4.5-6.13c-.25-.12-1.48-.73-1.71-.81-.23-.09-.39-.12-.56.12-.16.24-.64.81-.78.98-.15.16-.29.18-.54.06-.25-.12-1.04-.38-1.98-1.21-.73-.65-1.22-1.45-1.36-1.7-.14-.24-.01-.37.11-.49.11-.11.25-.29.37-.43.12-.14.16-.24.25-.4.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.76-1.85-.2-.49-.4-.43-.56-.44h-.48c-.16 0-.43.06-.65.31-.22.24-.86.84-.86 2.06 0 1.22.88 2.4 1 2.56.12.16 1.72 2.63 4.16 3.69.58.25 1.03.4 1.38.51.58.18 1.11.15 1.53.09.47-.07 1.48-.6 1.69-1.17.21-.58.21-1.08.15-1.18-.06-.1-.22-.16-.46-.28z" />
      </svg>
    </motion.a>
  );
};

export default FloatingWhatsAppButton;
