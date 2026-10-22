import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoCard from './VideoCard';
import { parseYouTubeInput } from '../utils/youtube';

// Helper to determine aspect ratio ('9/16' or '16/9')
function getProjectAspectRatio(project) {
  if (project?.aspectRatio === '9/16' || project?.aspectRatio === '16/9') {
    return project.aspectRatio;
  }
  const raw = project?.youtubeEmbed || project?.youtubeUrl || project?.youtube || project?.video;
  const parsed = parseYouTubeInput(raw, project?.aspectRatio);
  return parsed?.aspectRatio || '16/9';
}

export default function VideoCarousel({
  projects = [],
  currentIndex = 0,
  onChangeIndex,
  onPrev,
  onNext
}) {
  const containerRef = useRef(null);
  const total = projects.length;

  const handlePrev = () => {
    if (onPrev) onPrev();
    else onChangeIndex((currentIndex - 1 + total) % total);
  };

  const handleNext = () => {
    if (onNext) onNext();
    else onChangeIndex((currentIndex + 1) % total);
  };

  // Track responsive screen size
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  // Check prefers-reduced-motion
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, total, onChangeIndex]);

  // Swipe / Drag Handler
  const handleDragEnd = (event, info) => {
    const swipeThreshold = 35;
    const velocityThreshold = 200;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      handlePrev();
    }
  };

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;

  // Active project aspect ratio check
  const activeProject = projects[currentIndex] || {};
  const activeAspectRatio = getProjectAspectRatio(activeProject);
  const isActiveHorizontal = activeAspectRatio === '16/9';

  // Helper to compute card dimensions per project
  const getCardDimensions = (project) => {
    const isHorizontal = getProjectAspectRatio(project) === '16/9';

    if (isMobile) {
      if (isHorizontal) {
        const width = Math.min(320, Math.round(windowWidth * 0.86));
        const height = Math.round(width * (9 / 16));
        return { width, height };
      } else {
        const width = Math.min(270, Math.round(windowWidth * 0.70));
        const height = Math.round(width * (16 / 9));
        return { width, height };
      }
    }

    if (isTablet) {
      if (isHorizontal) {
        return { width: 460, height: 259 };
      } else {
        const height = 480;
        const width = Math.round(height * (9 / 16));
        return { width, height };
      }
    }

    // Desktop
    if (isHorizontal) {
      return { width: 560, height: 315 };
    } else {
      return { width: 310, height: 550 };
    }
  };

  // Base spacing
  let spacing1 = isActiveHorizontal ? 480 : 350;
  let spacing2 = isActiveHorizontal ? 340 : 260;

  if (isMobile) {
    spacing1 = Math.round(windowWidth * (isActiveHorizontal ? 0.88 : 0.76));
    spacing2 = spacing1;
  } else if (isTablet) {
    spacing1 = isActiveHorizontal ? 400 : 290;
    spacing2 = isActiveHorizontal ? 280 : 220;
  }

  // Dynamic Stage Height
  let stageHeight = isActiveHorizontal ? 420 : 620;
  if (isTablet) {
    stageHeight = isActiveHorizontal ? 350 : 540;
  } else if (isMobile) {
    stageHeight = isActiveHorizontal ? 280 : 520;
  }

  const transitionConfig = isReducedMotion
    ? { duration: 0.01 }
    : {
        type: 'spring',
        stiffness: 240,
        damping: 26,
        mass: 0.85
      };

  return (
    <div
      className="video-carousel-stage"
      ref={containerRef}
      style={{ height: `${stageHeight}px`, transition: 'height 0.45s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      {/* Ambient Spotlight Glow Layer */}
      <div className="carousel-ambient-spotlight" aria-hidden="true" />

      {/* Flanking In-Stage Prev & Next Navigation Buttons */}
      {total > 1 && !isMobile && (
        <div className="carousel-flank-controls">
          <motion.button
            type="button"
            className="carousel-flank-btn flank-prev"
            onClick={handlePrev}
            whileHover={{ scale: 1.12, x: -4 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Previous project"
            data-hover-type="link"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </motion.button>
          <motion.button
            type="button"
            className="carousel-flank-btn flank-next"
            onClick={handleNext}
            whileHover={{ scale: 1.12, x: 4 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Next project"
            data-hover-type="link"
          >
            <ChevronRight size={22} strokeWidth={2.2} />
          </motion.button>
        </div>
      )}

      <motion.div
        className="video-carousel-track"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ touchAction: 'pan-y' }}
      >
        {projects.map((project, idx) => {
          let diff = idx - currentIndex;
          while (diff > total / 2) diff -= total;
          while (diff < -total / 2) diff += total;

          const absDiff = Math.abs(diff);
          const isActive = diff === 0;
          const { width: cardWidth, height: cardHeight } = getCardDimensions(project);

          let targetX = 0;
          let targetScale = 1;
          let targetOpacity = 1;
          let targetFilter = 'brightness(1) blur(0px)';
          let targetRotateY = 0;
          let targetZIndex = 10;
          let pointerEvents = 'auto';

          if (diff === 0) {
            targetX = 0;
            targetScale = 1;
            targetOpacity = 1;
            targetFilter = 'brightness(1) blur(0px)';
            targetRotateY = 0;
            targetZIndex = 10;
          } else if (absDiff === 1) {
            targetX = diff * spacing1;
            targetScale = 0.84;
            targetOpacity = isMobile ? 0.35 : 0.65;
            targetFilter = 'brightness(0.6) blur(1.5px)';
            targetRotateY = isMobile ? 0 : (diff > 0 ? -9 : 9);
            targetZIndex = 5;
          } else if (absDiff === 2) {
            targetX = diff > 0 ? (spacing1 + spacing2) : -(spacing1 + spacing2);
            targetScale = 0.68;
            targetOpacity = (isMobile || isTablet) ? 0 : 0.35;
            targetFilter = 'brightness(0.35) blur(3.5px)';
            targetRotateY = diff > 0 ? -14 : 14;
            targetZIndex = 2;
            if (isMobile || isTablet) pointerEvents = 'none';
          } else {
            targetX = diff > 0 ? 1000 : -1000;
            targetScale = 0.45;
            targetOpacity = 0;
            targetFilter = 'brightness(0.2) blur(8px)';
            targetRotateY = diff > 0 ? -16 : 16;
            targetZIndex = 0;
            pointerEvents = 'none';
          }

          return (
            <motion.div
              key={project.id || idx}
              className="carousel-card-slot"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginLeft: `-${cardWidth / 2}px`,
                marginTop: `-${cardHeight / 2}px`,
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                pointerEvents
              }}
              initial={false}
              animate={{
                x: targetX,
                scale: targetScale,
                opacity: targetOpacity,
                filter: targetFilter,
                rotateY: targetRotateY,
                zIndex: targetZIndex
              }}
              transition={transitionConfig}
            >
              <VideoCard
                project={project}
                index={idx}
                offset={diff}
                isActive={isActive}
                onSelect={onChangeIndex}
                isReducedMotion={isReducedMotion}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

