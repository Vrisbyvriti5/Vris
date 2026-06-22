import React from 'react';
import { MapPin } from 'lucide-react';

const AddressSection = ({ address, onChangeAddress }) => {
  const hasAddress = Boolean(address);

  return (
    <section className="rounded-xl border border-[#ebedf0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#6b7280]">
            <MapPin size={14} /> Deliver To
          </p>
          {hasAddress ? (
            <>
              <p className="mt-2 text-sm font-semibold text-[#111827]">
                {address.fullName}, {address.pincode}
              </p>
              <p className="mt-1 text-sm text-[#6b7280]">
                {address.fullAddress}, {address.city}, {address.state}
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm font-semibold text-[#111827]">Add a delivery address to continue</p>
              <p className="mt-1 text-sm text-[#6b7280]">Add your address for faster checkout and delivery estimates.</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onChangeAddress}
          className="rounded-lg border border-[#e0b090] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#e0b090] transition-colors hover:bg-[#fbf5f1]"
        >
          {hasAddress ? 'Change Address' : 'Add Address'}
        </button>
      </div>
    </section>
  );
};

export default AddressSection;
