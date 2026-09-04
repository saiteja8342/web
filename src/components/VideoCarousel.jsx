import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  onChangeIndex
}) {
  const containerRef = useRef(null);
  const total = projects.length;

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
        onChangeIndex((currentIndex - 1 + total) % total);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onChangeIndex((currentIndex + 1) % total);
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
      onChangeIndex((currentIndex + 1) % total);
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      onChangeIndex((currentIndex - 1 + total) % total);
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
        const width = Math.min(260, Math.round(windowWidth * 0.68));
        const height = Math.round(width * (16 / 9));
        return { width, height };
      }
    }

    if (isTablet) {
      if (isHorizontal) {
        return { width: 440, height: 248 };
      } else {
        return { width: 260, height: 462 };
      }
    }

    // Desktop
    if (isHorizontal) {
      return { width: 540, height: 304 };
    } else {
      return { width: 300, height: 533 };
    }
  };

  // Base spacing
  let spacing1 = isActiveHorizontal ? 480 : 340;
  let spacing2 = isActiveHorizontal ? 340 : 250;

  if (isMobile) {
    spacing1 = Math.round(windowWidth * (isActiveHorizontal ? 0.90 : 0.74));
    spacing2 = spacing1;
  } else if (isTablet) {
    spacing1 = isActiveHorizontal ? 400 : 280;
    spacing2 = isActiveHorizontal ? 280 : 210;
  }

  // Dynamic Stage Height
  let stageHeight = isActiveHorizontal ? 380 : 580;
  if (isTablet) {
    stageHeight = isActiveHorizontal ? 320 : 510;
  } else if (isMobile) {
    stageHeight = isActiveHorizontal ? 260 : 490;
  }

  const transitionConfig = isReducedMotion
    ? { duration: 0.01 }
    : {
        duration: 0.65,
        ease: [0.25, 0.46, 0.45, 0.94]
      };

  return (
    <div
      className="video-carousel-stage"
      ref={containerRef}
      style={{ height: `${stageHeight}px`, transition: 'height 0.4s ease' }}
    >
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
            targetScale = 0.85;
            targetOpacity = isMobile ? 0.35 : 0.60;
            targetFilter = 'brightness(0.5) blur(1px)';
            targetRotateY = isMobile ? 0 : (diff > 0 ? -3 : 3);
            targetZIndex = 5;
          } else if (absDiff === 2) {
            targetX = diff > 0 ? (spacing1 + spacing2) : -(spacing1 + spacing2);
            targetScale = 0.70;
            targetOpacity = (isMobile || isTablet) ? 0 : 0.40;
            targetFilter = 'brightness(0.4) blur(3px)';
            targetRotateY = diff > 0 ? -4 : 4;
            targetZIndex = 2;
            if (isMobile || isTablet) pointerEvents = 'none';
          } else {
            targetX = diff > 0 ? 900 : -900;
            targetScale = 0.50;
            targetOpacity = 0;
            targetFilter = 'brightness(0.2) blur(6px)';
            targetRotateY = diff > 0 ? -4 : 4;
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
