import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CarouselNavigation({
  total = 5,
  onPrev,
  onNext
}) {
  const formattedTotal = String(total).padStart(2, '0');

  return (
    <div className="carousel-nav-header">
      <div className="carousel-nav-counter">
        <span className="carousel-nav-counter-text">
          SHOWING 01 — {formattedTotal} PROJECTS
        </span>
      </div>

      <div className="carousel-nav-buttons">
        <button
          type="button"
          onClick={onPrev}
          className="carousel-arrow-btn"
          aria-label="Previous project"
          data-hover-type="link"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="carousel-arrow-btn"
          aria-label="Next project"
          data-hover-type="link"
        >
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
