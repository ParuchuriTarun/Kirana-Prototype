import React, { useRef, useState, useEffect, useCallback } from 'react';

export default function DualRangeSlider({
  min = 25,
  max = 500,
  step = 5,
  value = [25, 500],
  onChange
}) {
  const [minVal, maxVal] = value;
  const trackRef = useRef(null);

  // Ref to hold mutable drag state to avoid recreating event listeners on every frame
  const dragInfo = useRef({
    activeThumb: null, // 'min' | 'max' | null
    rect: null,
    minVal,
    maxVal,
  });

  // Keep ref synchronized with current values
  dragInfo.current.minVal = minVal;
  dragInfo.current.maxVal = maxVal;

  const [activeThumb, setActiveThumb] = useState(null);

  const getPercent = (val) => {
    const pct = ((val - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const calculateValue = useCallback(
    (clientX, rect) => {
      if (!rect || rect.width === 0) return min;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawVal = min + ratio * (max - min);
      const stepped = Math.round(rawVal / step) * step;
      return Math.max(min, Math.min(max, stepped));
    },
    [min, max, step]
  );

  // Start dragging a specific thumb
  const handlePointerDownThumb = (thumb, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    dragInfo.current.rect = rect;
    dragInfo.current.activeThumb = thumb;
    setActiveThumb(thumb);
  };

  // Click anywhere on track to jump nearest thumb and start dragging
  const handlePointerDownTrack = (e) => {
    e.preventDefault();
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    dragInfo.current.rect = rect;

    const clickedVal = calculateValue(e.clientX, rect);
    const distToMin = Math.abs(clickedVal - dragInfo.current.minVal);
    const distToMax = Math.abs(clickedVal - dragInfo.current.maxVal);

    if (distToMin <= distToMax) {
      const newMin = Math.max(min, Math.min(clickedVal, dragInfo.current.maxVal - step));
      dragInfo.current.minVal = newMin;
      dragInfo.current.activeThumb = 'min';
      setActiveThumb('min');
      onChange([newMin, dragInfo.current.maxVal]);
    } else {
      const newMax = Math.min(max, Math.max(clickedVal, dragInfo.current.minVal + step));
      dragInfo.current.maxVal = newMax;
      dragInfo.current.activeThumb = 'max';
      setActiveThumb('max');
      onChange([dragInfo.current.minVal, newMax]);
    }
  };

  // Global window listeners for drag move & release (attached once, never recreated on re-renders)
  useEffect(() => {
    const handlePointerMove = (e) => {
      const { activeThumb, rect, minVal: curMin, maxVal: curMax } = dragInfo.current;
      if (!activeThumb || !rect) return;

      const currentVal = calculateValue(e.clientX, rect);

      if (activeThumb === 'min') {
        const newMin = Math.max(min, Math.min(currentVal, curMax - step));
        if (newMin !== curMin) {
          dragInfo.current.minVal = newMin;
          onChange([newMin, curMax]);
        }
      } else if (activeThumb === 'max') {
        const newMax = Math.min(max, Math.max(currentVal, curMin + step));
        if (newMax !== curMax) {
          dragInfo.current.maxVal = newMax;
          onChange([curMin, newMax]);
        }
      }
    };

    const handlePointerUp = () => {
      if (dragInfo.current.activeThumb) {
        dragInfo.current.activeThumb = null;
        dragInfo.current.rect = null;
        setActiveThumb(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('blur', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', handlePointerUp);
    };
  }, [min, max, step, calculateValue, onChange]);

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  return (
    <div className={`w-full py-3 select-none ${activeThumb ? 'cursor-grabbing' : ''}`}>
      {/* Outer Clickable Track Area with touch-none */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDownTrack}
        className="relative w-full h-8 flex items-center cursor-pointer touch-none"
      >
        {/* Background Track */}
        <div className="w-full h-2 bg-neutral-200 rounded-full" />

        {/* Highlighted Range Bar between Dot x and Dot y */}
        <div
          className="absolute h-2 bg-emerald-700 rounded-full pointer-events-none"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`
          }}
        />

        {/* Dot 1: x (From) */}
        <div
          role="slider"
          aria-label="Price range from"
          aria-valuemin={min}
          aria-valuemax={maxVal - step}
          aria-valuenow={minVal}
          tabIndex={0}
          onPointerDown={(e) => handlePointerDownThumb('min', e)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              onChange([Math.min(minVal + step, maxVal - step), maxVal]);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              onChange([Math.max(minVal - step, min), maxVal]);
            }
          }}
          className={`absolute -translate-x-1/2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[2.5px] border-emerald-700 shadow-[0_2px_8px_rgba(0,0,0,0.28)] flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-115 transition-transform touch-none outline-none ${
            activeThumb === 'min' ? 'scale-120 ring-4 ring-emerald-500/30 z-30' : 'z-20'
          } before:absolute before:-inset-3 before:content-['']`}
          style={{ left: `${minPercent}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-700 pointer-events-none" />
          
          {/* Floating Live Value Pill */}
          {activeThumb === 'min' && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md pointer-events-none whitespace-nowrap">
              ₹{minVal}
            </div>
          )}
        </div>

        {/* Dot 2: y (To) */}
        <div
          role="slider"
          aria-label="Price range to"
          aria-valuemin={minVal + step}
          aria-valuemax={max}
          aria-valuenow={maxVal}
          tabIndex={0}
          onPointerDown={(e) => handlePointerDownThumb('max', e)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              onChange([minVal, Math.min(maxVal + step, max)]);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              onChange([minVal, Math.max(maxVal - step, minVal + step)]);
            }
          }}
          className={`absolute -translate-x-1/2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[2.5px] border-emerald-700 shadow-[0_2px_8px_rgba(0,0,0,0.28)] flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-115 transition-transform touch-none outline-none ${
            activeThumb === 'max' ? 'scale-120 ring-4 ring-emerald-500/30 z-30' : 'z-20'
          } before:absolute before:-inset-3 before:content-['']`}
          style={{ left: `${maxPercent}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-emerald-700 pointer-events-none" />

          {/* Floating Live Value Pill */}
          {activeThumb === 'max' && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md pointer-events-none whitespace-nowrap">
              ₹{maxVal}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
