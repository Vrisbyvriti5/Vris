import React from 'react';
import { BadgePercent } from 'lucide-react';

const OffersSection = () => (
  <section className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
    <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">
      <BadgePercent size={14} /> Available Offers
    </p>

    <ul className="mt-2 space-y-1.5">
      <li className="text-sm text-[#4b5563]">Extra 10% off on first purchase for new users.</li>
    </ul>
  </section>
);

export default OffersSection;
