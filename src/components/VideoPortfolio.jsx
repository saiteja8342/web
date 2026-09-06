import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { projects as defaultProjects, categories as defaultCategories } from '../data/projects';
import CarouselNavigation from './CarouselNavigation';
import VideoCarousel from './VideoCarousel';
import CarouselPagination from './CarouselPagination';
import { getPublicPortfolioVideos } from '../lib/db/cms';

export default function VideoPortfolio({ isHeadingH1 = false }) {
  const [allProjects, setAllProjects] = useState(defaultProjects);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getPublicPortfolioVideos().then((dbVideos) => {
      if (isMounted && dbVideos && dbVideos.length > 0) {
        const transformed = dbVideos.map((v) => ({
          id: v.id,
          title: v.title,
          category: v.category?.toUpperCase() || 'REELS',
          metric: v.metric || '',
          youtubeUrl: v.youtube_url,
          aspectRatio: v.aspect_ratio || '16/9',
          duration: v.duration || '',
          desc: v.description || ''
        }));
        setAllProjects(transformed);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Dynamically compute category tabs from loaded projects
  const categories = useMemo(() => {
    const cats = new Set(['ALL']);
    allProjects.forEach(p => {
      if (p.category) cats.add(p.category.toUpperCase());
    });
    return Array.from(cats);
  }, [allProjects]);

  // Filter projects by category
  const filteredProjects = useMemo(() => {
    if (activeCategory === 'ALL') return allProjects;
    return allProjects.filter((p) => p.category === activeCategory);
  }, [allProjects, activeCategory]);

  const total = filteredProjects.length;

  // Safe index handler
  const safeIndex = total > 0 ? (currentIndex >= total ? 0 : currentIndex) : 0;

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
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
          {isHeadingH1 ? (
            <h1 className="portfolio-main-headline">Featured Projects</h1>
          ) : (
            <h2 className="portfolio-main-headline">Featured Projects</h2>
          )}
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
