import React from 'react';

export default function CarouselPagination({
  total = 5,
  currentIndex = 0,
  onSelectIndex
}) {
  const currentFormatted = String(currentIndex + 1).padStart(2, '0');
  const totalFormatted = String(total).padStart(2, '0');

  return (
    <div className="carousel-pagination-wrapper">
      {/* Dot Indicators */}
      <div className="carousel-dots-container" role="tablist" aria-label="Project navigation">
        {Array.from({ length: total }).map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to project ${idx + 1}`}
              className={`carousel-dot ${isActive ? 'carousel-dot-active' : ''}`}
              onClick={() => onSelectIndex(idx)}
            />
          );
        })}
      </div>

      {/* Dynamic Count Label */}
      <div className="carousel-count-label" aria-live="polite">
        {currentFormatted} OF {totalFormatted}
      </div>

      {/* Subtitle Interaction Hint */}
      <div className="carousel-drag-hint">
        DRAG OR SWIPE TO EXPLORE
      </div>
    </div>
  );
}
