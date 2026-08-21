import React, { useState, useCallback, useMemo } from 'react';
import { projects, categories } from '../data/projects';
import CarouselNavigation from './CarouselNavigation';
import VideoCarousel from './VideoCarousel';
import CarouselPagination from './CarouselPagination';

export default function VideoPortfolio() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter projects by category
  const filteredProjects = useMemo(() => {
    if (activeCategory === 'ALL') return projects;
    return projects.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const total = filteredProjects.length;

  // Safe index handler
  const safeIndex = currentIndex >= total ? 0 : currentIndex;

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handleSelectIndex = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const handleSelectCategory = (category) => {
    setActiveCategory(category);
    setCurrentIndex(0);
  };

  return (
    <section className="video-portfolio-section" id="work" aria-label="Featured Projects Video Portfolio">
      <div className="portfolio-content-container">
        
        {/* Section Header */}
        <div className="portfolio-top-header">
          <span className="portfolio-eyebrow-tag">OUR WORK</span>
          <h2 className="portfolio-main-headline">Featured Projects</h2>
          <p className="portfolio-subtext">
            Explore our portfolio filtered by category. Drag or swipe horizontally to view our vertical reels and widescreen productions.
          </p>

          {/* Category Filter Pills */}
          <div className="portfolio-category-filters" role="tablist" aria-label="Filter portfolio by category">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`category-filter-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectCategory(category)}
                  data-hover-type="link"
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Carousel Top Navigation Bar */}
        <CarouselNavigation
          total={total}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {/* Cinematic Horizontal Video Carousel */}
        <VideoCarousel
          key={activeCategory}
          projects={filteredProjects}
          currentIndex={safeIndex}
          onChangeIndex={handleSelectIndex}
        />

        {/* Carousel Pagination & Indicator Footer */}
        <CarouselPagination
          total={total}
          currentIndex={safeIndex}
          onSelectIndex={handleSelectIndex}
        />

      </div>
    </section>
  );
}
