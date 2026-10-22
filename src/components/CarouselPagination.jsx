import React from 'react';
import { motion } from 'framer-motion';

export default function CarouselPagination({
  total = 5,
  currentIndex = 0,
  onSelectIndex
}) {
  const currentFormatted = String(currentIndex + 1).padStart(2, '0');
  const totalFormatted = String(total).padStart(2, '0');

  return (
    <div className="carousel-pagination-wrapper">
      {/* Animated Dot Indicators */}
      <div className="carousel-dots-container" role="tablist" aria-label="Project navigation">
        {Array.from({ length: total }).map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <motion.button
              key={idx}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to project ${idx + 1}`}
              className={`carousel-dot ${isActive ? 'carousel-dot-active' : ''}`}
              onClick={() => onSelectIndex(idx)}
              animate={{
                width: isActive ? 28 : 8,
                opacity: isActive ? 1 : 0.35,
                backgroundColor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
              }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              whileHover={{ scale: 1.25, opacity: 0.85 }}
              whileTap={{ scale: 0.9 }}
            />
          );
        })}
      </div>

      {/* Dynamic Count Label with pill framing */}
      <div className="carousel-count-container" aria-live="polite">
        <span className="carousel-count-current">{currentFormatted}</span>
        <span className="carousel-count-divider">/</span>
        <span className="carousel-count-total">{totalFormatted}</span>
      </div>
    </div>
  );
}


