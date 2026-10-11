import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CarouselNavigation({
  onPrev,
  onNext
}) {
  return (
    <div className="carousel-nav-header" style={{ justifyContent: 'flex-end' }}>
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
