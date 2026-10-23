import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { projects as defaultProjects } from '../data/projects';
import VideoCarousel from './VideoCarousel';
import CarouselPagination from './CarouselPagination';
import ShimmerText from './ShimmerText';
import WorkStudioShowcase from './WorkStudioShowcase';
import { getPublicPortfolioVideos, getOurWorkSettings, DEFAULT_OUR_WORK_SETTINGS } from '../lib/db/cms';

export default function VideoPortfolio({ isHeadingH1 = false, layout = 'coverflow' }) {
  if (layout === 'split') {
    return <WorkStudioShowcase isHeadingH1={isHeadingH1} />;
  }

  const [allProjects, setAllProjects] = useState(defaultProjects);
  const [headerSettings, setHeaderSettings] = useState(DEFAULT_OUR_WORK_SETTINGS);
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

    getOurWorkSettings().then((data) => {
      if (isMounted && data) {
        setHeaderSettings(data);
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

  const handleSelectCategory = (category, e) => {
    setActiveCategory(category);
    setCurrentIndex(0);
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <section className="video-portfolio-section" id="work" aria-label="Featured Projects Video Portfolio">
      {/* Container aligned with the rest of the site (Hero, Services, Contact) */}
      <div className="container">
        {/* Section Header */}
        <div className="portfolio-top-header">
          <span className="caption eyebrow">
            {headerSettings.eyebrow || 'OUR WORK'}
          </span>
          <ShimmerText
            text={headerSettings.title || (isHeadingH1 ? 'Featured AI Video & Editing Work' : 'Featured Projects')}
            className="h2 portfolio-main-headline"
            as={isHeadingH1 ? 'h1' : 'h2'}
          />
          <p className="body-large portfolio-subtext">
            {headerSettings.subtitle || 'Explore our portfolio filtered by category. Drag or swipe horizontally to view our vertical reels and widescreen productions.'}
          </p>
        </div>

        {/* Category Filter Pills (Centered in the middle with sliding spring highlight) */}
        <div className="portfolio-category-filters" role="tablist" aria-label="Filter portfolio by category">
          <div className="portfolio-filters-track">
            {categories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`category-filter-pill ${isActive ? 'active' : ''}`}
                  onClick={(e) => handleSelectCategory(category, e)}
                  data-hover-type="link"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilterPill"
                      className="category-pill-indicator"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="category-pill-text">{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="portfolio-content-container">
        {/* Cinematic Horizontal Video Carousel */}
        <VideoCarousel
          key={activeCategory}
          projects={filteredProjects}
          currentIndex={safeIndex}
          onChangeIndex={handleSelectIndex}
          onPrev={handlePrev}
          onNext={handleNext}
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
