import React, { useState } from 'react';
import { BadgePercent } from 'lucide-react';

const OFFERS = [
  '7.5% assured cashback on prepaid orders above Rs 100.',
  'Flat Rs 150 off on cart value above Rs 2499 with select cards.',
  'Extra 10% off on first purchase for new users.',
];

const OffersSection = () => {
  const [showAllOffers, setShowAllOffers] = useState(false);
  const visibleOffers = showAllOffers ? OFFERS : OFFERS.slice(0, 1);

  return (
    <section className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
      <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">
        <BadgePercent size={14} /> Available Offers
      </p>

      <ul className="mt-2 space-y-1.5">
        {visibleOffers.map((offer) => (
          <li key={offer} className="text-sm text-[#4b5563]">{offer}</li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setShowAllOffers((prev) => !prev)}
        className="mt-3 text-sm font-semibold text-[#e0b090] transition-colors hover:text-[#d6a382]"
      >
        {showAllOffers ? 'Show Less' : 'Show More'}
      </button>
    </section>
  );
};

export default OffersSection;
