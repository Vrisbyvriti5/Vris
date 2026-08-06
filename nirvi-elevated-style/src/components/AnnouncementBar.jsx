import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AnnouncementBar = () => {
  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText('VRIS10');
    toast.success('Coupon code VRIS10 copied to clipboard!', { duration: 2000 });
  };

  const messages = [
    { type: 'text', text: 'VRISBYVRITI OFFICIALLY LIVE', icon: '🎉' },
    { type: 'coupon', text: 'GET 10% OFF ON YOUR FIRST ORDER USING CODE', code: 'VRIS10', icon: '🎁' },
    { type: 'text', text: 'FREE DELIVERY ON ORDERS ABOVE ₹2999', icon: '🚚' },
    { type: 'coupon', text: 'GET 10% OFF ON YOUR FIRST ORDER USING CODE', code: 'VRIS10', icon: '🎁' },
    { type: 'text', text: 'VRISBYVRITI OFFICIALLY LIVE', icon: '🎉' },
    { type: 'coupon', text: 'GET 10% OFF ON YOUR FIRST ORDER USING CODE', code: 'VRIS10', icon: '🎁' },
    { type: 'text', text: 'FREE DELIVERY ON ORDERS ABOVE ₹2999', icon: '🚚' },
    { type: 'coupon', text: 'GET 10% OFF ON YOUR FIRST ORDER USING CODE', code: 'VRIS10', icon: '🎁' },
  ];

  const renderMessage = (msg, index) => {
    if (msg.type === 'coupon') {
      return (
        <span key={index} className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-[0.15em] uppercase flex items-center gap-2 whitespace-nowrap">
          <span>{msg.icon}</span> {msg.text}
          <button
            onClick={handleCopy}
            className="font-bold text-yellow-300 transition-colors hover:text-yellow-100 bg-white/10 px-2 py-0.5 rounded cursor-pointer relative pointer-events-auto"
            title="Click to copy"
          >
            {msg.code}
          </button>
        </span>
      );
    }
    return (
      <span key={index} className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-[0.15em] uppercase flex items-center gap-2 whitespace-nowrap">
        <span>{msg.icon}</span> {msg.text}
      </span>
    );
  };

  return (
    <div className="bg-black text-white w-full overflow-hidden border-b border-white/10 flex items-center shrink-0 h-10 z-[60]">
      <div className="flex w-full h-full items-center overflow-hidden">
        <div className="flex min-w-full shrink-0 items-center justify-around gap-24 pr-24 animate-marquee group-hover:pause">
          {messages.map((msg, i) => renderMessage(msg, i))}
        </div>
        <div className="flex min-w-full shrink-0 items-center justify-around gap-24 pr-24 animate-marquee group-hover:pause" aria-hidden="true">
          {messages.map((msg, i) => renderMessage(msg, `dup-${i}`))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
