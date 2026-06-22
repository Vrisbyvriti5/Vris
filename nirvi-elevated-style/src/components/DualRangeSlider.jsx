import React, { useState, useCallback, useEffect } from 'react';
import { useFilter } from '@/context/FilterContext';

const DualRangeSlider = () => {
  const { priceRange, setPriceRange } = useFilter();
  const [localMin, setLocalMin] = useState(priceRange[0]);
  const [localMax, setLocalMax] = useState(priceRange[1]);
  const MIN_GAP = 0;
  const MAX_PRICE = 10000;

  useEffect(() => {
    setLocalMin(priceRange[0]);
    setLocalMax(priceRange[1]);
  }, [priceRange]);

  const handleMinChange = useCallback((e) => {
    const val = Math.min(Number(e.target.value), localMax - MIN_GAP);
    setLocalMin(val);
    setPriceRange([val, localMax]);
  }, [localMax, MIN_GAP, setPriceRange]);

  const handleMaxChange = useCallback((e) => {
    const val = Math.max(Number(e.target.value), localMin + MIN_GAP);
    setLocalMax(val);
    setPriceRange([localMin, val]);
  }, [localMin, MIN_GAP, setPriceRange]);

  const minPercent = (localMin / MAX_PRICE) * 100;
  const maxPercent = (localMax / MAX_PRICE) * 100;

  return (
    <div className="px-3 py-2">
      <div className="relative h-6 flex items-center">
        <div className="absolute w-full h-[3px] bg-gray-200 rounded-full">
          <div
            className="absolute h-full bg-[#e0b090] rounded-full"
            style={{
              left: `${minPercent}%`,
              right: `${100 - maxPercent}%`,
            }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={MAX_PRICE}
          step={100}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-[3px] appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e0b090] [&::-webkit-slider-thumb]:border-[1.5px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:-mt-0 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#e0b090] [&::-moz-range-thumb]:border-[1.5px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
          aria-label="Minimum price"
        />

        <input
          type="range"
          min={0}
          max={MAX_PRICE}
          step={100}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-[3px] appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#e0b090] [&::-webkit-slider-thumb]:border-[1.5px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:-mt-0 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#e0b090] [&::-moz-range-thumb]:border-[1.5px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:cursor-pointer"
          aria-label="Maximum price"
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-[11px] font-medium text-gray-700">
          ₹{localMin}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-[11px] font-medium text-gray-700">
          ₹{localMax}
        </div>
      </div>
    </div>
  );
};

export default DualRangeSlider;
