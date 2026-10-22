import React from 'react';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';

export default function CarouselNavigation({
  total = 0,
  currentIndex = 0,
  onPrev,
  onNext
}) {
  const currentFormatted = String(currentIndex + 1).padStart(2, '0');
  const totalFormatted = String(total).padStart(2, '0');

  return (
    <div className="carousel-nav-header">
      {/* Left Counter & Production Mode */}
      <div className="carousel-nav-status">
        <span className="carousel-nav-live-dot" aria-hidden="true" />
        <span className="carousel-nav-status-text">
          <Film size={13} className="mr-1 inline-block opacity-70" />
          FEATURED CUT {currentFormatted} <span className="opacity-40">/ {totalFormatted}</span>
        </span>
      </div>

      {/* Right Navigation Arrow Buttons */}
      <div className="carousel-nav-buttons">
        <button
          type="button"
          onClick={onPrev}
          className="carousel-arrow-btn"
          aria-label="Previous project"
          data-hover-type="link"
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="carousel-arrow-btn"
          aria-label="Next project"
          data-hover-type="link"
        >
          <ChevronRight size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}

