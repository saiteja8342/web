// Check if touch device
        const isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

        // Wait for DOM
        document.addEventListener("DOMContentLoaded", () => {
            
            // Register ScrollTrigger
            gsap.registerPlugin(ScrollTrigger);

            // Smooth Scroll with Lenis
            const lenis = new Lenis({
                lerp: 0.08,
                smooth: true,
                direction: 'vertical'
            });

            lenis.on('scroll', ScrollTrigger.update);

            gsap.ticker.add((time) => {
                lenis.raf(time * 1000);
            });
            gsap.ticker.lagSmoothing(0, 0);

            // Custom Cursor
            const cursorRing = document.getElementById('cursorRing');
            const cursorDot = document.getElementById('cursorDot');
            const cursorLabel = document.getElementById('cursorLabel');
            
            if (!isTouchDevice && cursorRing && cursorDot) {
                let mouseX = window.innerWidth / 2;
                let mouseY = window.innerHeight / 2;
                let ringX = mouseX;
                let ringY = mouseY;

                window.addEventListener('mousemove', (e) => {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    gsap.set(cursorDot, { x: mouseX, y: mouseY });
                });

                const renderCursor = () => {
                    ringX += (mouseX - ringX) * 0.15;
                    ringY += (mouseY - ringY) * 0.15;
                    gsap.set(cursorRing, { x: ringX, y: ringY });
                    requestAnimationFrame(renderCursor);
                };
                requestAnimationFrame(renderCursor);

                const hoverElements = document.querySelectorAll('[data-hover-type]');
                hoverElements.forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        const type = el.getAttribute('data-hover-type');
                        cursorDot.classList.add('hidden');
                        
                        if (type === 'link') {
                            cursorRing.classList.add('hover-active');
                        } else if (type === 'card') {
                            cursorRing.classList.add('video-hover');
                            cursorLabel.textContent = el.getAttribute('data-hover-label') || 'VIEW';
                        }
                    });
                    
                    el.addEventListener('mouseleave', () => {
                        cursorDot.classList.remove('hidden');
                        cursorRing.classList.remove('hover-active');
                        cursorRing.classList.remove('video-hover');
                        cursorLabel.textContent = '';
                    });
                });
            }

            // Split Hero Title into Words
            const heroTitle = document.getElementById('heroTitle');
            if(heroTitle) {
                const words = heroTitle.innerText.trim().split(' ');
                heroTitle.innerHTML = '';
                words.forEach(word => {
                    const span = document.createElement('span');
                    span.classList.add('word');
                    span.innerHTML = word + '&nbsp;';
                    heroTitle.appendChild(span);
                });
            }

            // Loader
            const initLoader = () => {
                const tl = gsap.timeline();

                // Load bar fills
                tl.to('#loaderBar', {
                    scaleX: 1,
                    duration: 0.3,
                    ease: 'power3.inOut'
                })
                // Split screen
                .to('#loaderTop', {
                    yPercent: -100,
                    duration: 0.4,
                    ease: 'power3.inOut'
                }, "+=0.05")
                .to('#loaderBottom', {
                    yPercent: 100,
                    duration: 0.4,
                    ease: 'power3.inOut'
                }, "<")
                .to('#loaderContent', {
                    opacity: 0,
                    duration: 0.3
                }, "<")
                // Hide loader container
                .set('#loader', { display: 'none' })
                
                // Hero Animations
                .fromTo('.hero-eyebrow', 
                    { opacity: 0, y: 20 }, 
                    { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 
                    "-=0.4"
                )
                .fromTo('.hero-h1 .word',
                    { clipPath: 'inset(0 0 100% 0)', y: 20 },
                    { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' },
                    "<0.2"
                )
                .to('#heroSub', {
                    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
                }, "-=0.2")
                .to('#heroBtns', {
                    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
                }, "+=0.2")
                .to('#scrollIndicator', {
                    opacity: 1, y: 0, duration: 1, ease: 'power3.out'
                }, "+=0.5");
            };

            // Run loader immediately since we are already in DOMContentLoaded
            initLoader();

            // Navigation
            const nav = document.getElementById('nav');
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
            });

            // Mobile Menu
            const hamburger = document.getElementById('hamburger');
            const mobileNav = document.getElementById('mobileNav');
            const mobileLinks = mobileNav.querySelectorAll('a');
            
            hamburger.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
            });
            
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.remove('active');
                });
            });

            // Scroll Animations
            const headingClips = document.querySelectorAll('.section-heading-clip');
            headingClips.forEach(el => {
                gsap.fromTo(el, 
                    { clipPath: 'inset(100% 0 0 0)', y: 40 },
                    {
                        clipPath: 'inset(0% 0 0 0)', y: 0,
                        duration: 0.9,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            once: true
                        }
                    }
                );
            });

            // Scroll Animations (Elements): Elements
            const revealElements = document.querySelectorAll('.reveal-element');
            revealElements.forEach(el => {
                gsap.fromTo(el,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1, y: 0,
                        duration: 0.7,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: el,
                            start: 'top 85%',
                            once: true
                        }
                    }
                );
            });

            // Stat Counters
            const counters = document.querySelectorAll('.counter');
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                gsap.to(counter, {
                    innerHTML: target,
                    duration: 2,
                    snap: { innerHTML: 1 },
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: counter,
                        start: 'top 90%',
                        once: true
                    }
                });
            });

            // Portfolio video hover play/pause
            document.querySelectorAll('.portfolio-thumb').forEach(thumb => {
              const video = thumb.querySelector('.portfolio-video');
              if (!video) return;

              thumb.addEventListener('mouseenter', () => {
                video.play().catch(() => {});
              });

              thumb.addEventListener('mouseleave', () => {
                video.pause();
                video.currentTime = 0;
              });

              // Touch device support
              thumb.addEventListener('touchstart', () => {
                if (video.paused) {
                  video.play().catch(() => {});
                } else {
                  video.pause();
                }
              }, { passive: true });
            });

            // Hero video fallback — if autoplay blocked, show poster
            const heroVideo = document.querySelector('.hero-video');
            if (heroVideo) {
              heroVideo.addEventListener('error', () => {
                heroVideo.style.display = 'none';
              });
            }

            // Hero Video Controls
            const heroVideoWrapper = document.querySelector('.hero-video-wrapper');
            if (heroVideoWrapper && heroVideo) {
              const playBtn = heroVideoWrapper.querySelector('.hero-play-pause');
              const muteBtn = heroVideoWrapper.querySelector('.hero-mute-btn');
              const fsBtn = heroVideoWrapper.querySelector('.hero-fullscreen-btn');

              let heroHideTimeout;
              heroVideoWrapper.addEventListener('touchstart', (e) => {
                if (!e.target.closest('.v-btn')) {
                    heroVideoWrapper.classList.toggle('show-controls');
                    clearTimeout(heroHideTimeout);
                    if (heroVideoWrapper.classList.contains('show-controls')) {
                        heroHideTimeout = setTimeout(() => {
                            heroVideoWrapper.classList.remove('show-controls');
                        }, 3000);
                    }
                }
              }, { passive: true });

              if (playBtn) {
                playBtn.addEventListener('click', e => {
                  e.stopPropagation();
                  const pausePath = playBtn.querySelector('.v-pause');
                  const playPath  = playBtn.querySelector('.v-play');
                  if (heroVideo.paused) {
                    heroVideo.play().catch(() => {});
                    if (pausePath) pausePath.style.display = '';
                    if (playPath)  playPath.style.display  = 'none';
                  } else {
                    heroVideo.pause();
                    if (pausePath) pausePath.style.display = 'none';
                    if (playPath)  playPath.style.display  = '';
                  }
                });
              }

              if (muteBtn) {
                muteBtn.addEventListener('click', e => {
                  e.stopPropagation();
                  heroVideo.muted = !heroVideo.muted;
                  const soundOn  = muteBtn.querySelector('.v-sound-on');
                  const soundOff = muteBtn.querySelector('.v-sound-off');
                  if (soundOn)  soundOn.style.display  = heroVideo.muted ? 'none' : '';
                  if (soundOff) soundOff.style.display = heroVideo.muted ? ''     : 'none';
                });
              }

              if (fsBtn) {
                fsBtn.addEventListener('click', e => {
                  e.stopPropagation();
                  if (heroVideo.requestFullscreen) {
                    heroVideo.requestFullscreen();
                  } else if (heroVideo.webkitRequestFullscreen) {
                    heroVideo.webkitRequestFullscreen();
                  } else if (heroVideo.msRequestFullscreen) {
                    heroVideo.msRequestFullscreen();
                  }
                });
              }
            }

function toggleMute(vid, muteBtn) {
  if (!vid) return;
  vid.muted = !vid.muted;
  if (muteBtn) {
    const iconOn = muteBtn.querySelector('.icon-unmuted, .v-sound-on');
    const iconOff = muteBtn.querySelector('.icon-muted, .v-sound-off');
    if (iconOn) iconOn.style.display = vid.muted ? 'none' : '';
    if (iconOff) iconOff.style.display = vid.muted ? '' : 'none';
  }
}

function togglePlayPause(vid, playPauseBtn) {
  const iconPause = playPauseBtn ? playPauseBtn.querySelector('.icon-pause, .v-pause') : null;
  const iconPlay  = playPauseBtn ? playPauseBtn.querySelector('.icon-play, .v-play') : null;
  if (vid.paused) {
    vid.play().catch(() => {});
    if (iconPause) iconPause.style.display = '';
    if (iconPlay)  iconPlay.style.display  = 'none';
  } else {
    vid.pause();
    if (iconPause) iconPause.style.display = 'none';
    if (iconPlay)  iconPlay.style.display  = '';
  }
}

function toggleFullscreen(vid) {
  if (vid.requestFullscreen) {
    vid.requestFullscreen();
  } else if (vid.webkitRequestFullscreen) {
    vid.webkitRequestFullscreen();
  } else if (vid.msRequestFullscreen) {
    vid.msRequestFullscreen();
  }
}

// Portfolio Horizontal Videos
document.querySelectorAll('.h-video-card').forEach(card => {
  const vid = card.querySelector('.h-vid');
  if (!vid) return;

  vid.play().catch(() => {});

  let hideTimeout;
  card.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.vid-btn')) {
        card.classList.toggle('show-controls');
        clearTimeout(hideTimeout);
        if (card.classList.contains('show-controls')) {
            hideTimeout = setTimeout(() => {
                card.classList.remove('show-controls');
            }, 3000);
        }
    }
  }, { passive: true });

  const playPauseBtn = card.querySelector('.play-pause-btn');
  const muteBtn = card.querySelector('.mute-btn');
  const fsBtn = card.querySelector('.fullscreen-btn');

  card.addEventListener('click', (e) => {
    if (e.target.closest('.vid-btn')) return;
    togglePlayPause(vid, playPauseBtn);
  });

  card.addEventListener('dblclick', (e) => {
    if (e.target.closest('.vid-btn')) return;
    toggleFullscreen(vid);
  });

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', e => {
      e.stopPropagation();
      togglePlayPause(vid, playPauseBtn);
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleMute(vid, muteBtn);
    });
  }

  if (fsBtn) {
    fsBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFullscreen(vid);
    });
  }
});

// Reel Vertical Videos
document.querySelectorAll('.v-reel-card').forEach(card => {
  const vid      = card.querySelector('.v-vid');
  const playBtn  = card.querySelector('.v-play-pause');
  const muteBtn  = card.querySelector('.v-mute-btn');
  const fsBtn    = card.querySelector('.v-fullscreen-btn');
  if (!vid) return;

  vid.play().catch(() => {});

  let hideTimeout;
  card.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.v-btn')) {
        card.classList.toggle('show-controls');
        clearTimeout(hideTimeout);
        if (card.classList.contains('show-controls')) {
            hideTimeout = setTimeout(() => {
                card.classList.remove('show-controls');
            }, 3000);
        }
    }
  }, { passive: true });

  card.addEventListener('click', (e) => {
    if (e.target.closest('.v-btn')) return;
    togglePlayPause(vid, playBtn);
  });

  card.addEventListener('dblclick', (e) => {
    if (e.target.closest('.v-btn')) return;
    toggleFullscreen(vid);
  });

  if (playBtn) {
    playBtn.addEventListener('click', e => {
      e.stopPropagation();
      togglePlayPause(vid, playBtn);
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleMute(vid, muteBtn);
    });
  }

  if (fsBtn) {
    fsBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFullscreen(vid);
    });
  }
});

// Contact Form
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnText = contactForm.querySelector('.btn-text');
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const btnSpinner = contactForm.querySelector('.btn-spinner');
    const successMsg = document.getElementById('formSuccess');
    const errorMsg = document.getElementById('formError');

    if (btnText) btnText.textContent = 'Sending...';
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    if (submitBtn) submitBtn.disabled = true;
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    try {
      const formData = new FormData(contactForm);
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
      });

      if (response.ok) {
        contactForm.reset();
        if (successMsg) {
          successMsg.style.display = 'block';
          setTimeout(() => {
            successMsg.style.display = 'none';
          }, 5000);
        }
        if (typeof gtag === 'function') {
          gtag('event', 'form_submit', {
            form_name: 'Project Inquiry Form'
          });
        }
      } else {
        if (errorMsg) errorMsg.style.display = 'block';
      }
    } catch (error) {
      if (errorMsg) errorMsg.style.display = 'block';
    } finally {
      if (btnText) btnText.textContent = 'Send Message →';
      if (btnSpinner) btnSpinner.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// WhatsApp Widget
const waBtn = document.getElementById('waBtn');
const waPopup = document.getElementById('waPopup');
const waCloseBtn = document.getElementById('waCloseBtn');
const waSecondaryClose = document.getElementById('waSecondaryClose');
const waStartChat = document.getElementById('waStartChat');
const waBubble = document.getElementById('waBubble');
const waSubtitle = document.getElementById('waPopupSubtitle');

if (waBtn && waPopup) {
    // Show button with animation
    setTimeout(() => {
        waBtn.classList.add('visible');
    }, 1000);

    // Show bubble after 5 seconds
    setTimeout(() => {
        if (!waPopup.classList.contains('open')) {
            waBubble.classList.add('show');
        }
    }, 5000);

    // Close bubble on hover or click
    waBtn.addEventListener('mouseenter', () => waBubble.classList.remove('show'));
    waBtn.addEventListener('click', () => waBubble.classList.remove('show'));

    // Open Popup
    waBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        waPopup.classList.add('open');
        
        // Typing animation for subtitle
        waSubtitle.textContent = '';
        const text = 'How can we help today?';
        let i = 0;
        const typeWriter = setInterval(() => {
            if (i < text.length) {
                waSubtitle.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeWriter);
            }
        }, 50);
    });

    // Close Popup functions
    const closePopup = () => {
        waPopup.classList.remove('open');
        setTimeout(() => {
            waSubtitle.textContent = 'Chat directly with MotionNodeEdits.';
        }, 300); // Reset text after fade out
    };

    waCloseBtn.addEventListener('click', closePopup);
    waSecondaryClose.addEventListener('click', closePopup);

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (waPopup.classList.contains('open') && !waPopup.contains(e.target) && e.target !== waBtn && !waBtn.contains(e.target)) {
            closePopup();
        }
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && waPopup.classList.contains('open')) {
            closePopup();
        }
    });

    // Service Chips Selection
    const serviceChips = waPopup.querySelectorAll('.wa-services li');
    let selectedService = null;

    serviceChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active from all
            serviceChips.forEach(c => c.classList.remove('selected'));
            // Add active to clicked
            chip.classList.add('selected');
            selectedService = chip.textContent.trim();
        });
    });

    // Start Chat Action
    waStartChat.addEventListener('click', () => {
        let message = 'Hi MotionNodeEdits,\n\nI am interested in your services.\n\nCan we discuss my project?';

        if (selectedService === 'Video Editing') {
            message = 'Hi MotionNodeEdits,\n\nI am interested in Video Editing services.\n\nCan we discuss my project?';
        } else if (selectedService === 'Motion Graphics') {
            message = 'Hi MotionNodeEdits,\n\nI am interested in Motion Graphics services.\n\nCan we discuss my project?';
        } else if (selectedService === 'YouTube Videos') {
            message = 'Hi MotionNodeEdits,\n\nI am interested in YouTube Video Editing services.\n\nCan we discuss my project?';
        } else if (selectedService === 'Short Form Reels') {
            message = 'Hi MotionNodeEdits,\n\nI am interested in Short Form Reel Editing services.\n\nCan we discuss my project?';
        } else if (selectedService === 'Social Media Content') {
            message = 'Hi MotionNodeEdits,\n\nI need help with Social Media Content Editing.\n\nCan we discuss my project?';
        } else if (selectedService === 'Brand Films') {
            message = 'Hi MotionNodeEdits,\n\nI am interested in Brand Film Editing services.\n\nCan we discuss my project?';
        } else if (selectedService === 'Creative Strategy') {
            message = 'Hi MotionNodeEdits,\n\nI would like to discuss Creative Strategy services.\n\nCan we discuss my project?';
        } else if (selectedService === 'Pricing Questions') {
            message = 'Hi MotionNodeEdits,\n\nI have some questions regarding pricing.\n\nCan we discuss my requirements?';
        }

        const encodedText = encodeURIComponent(message);
        window.open(`https://wa.me/918985351756?text=${encodedText}`, '_blank', 'noopener,noreferrer');
    });
}

            // SKELETON LOADERS CONTROLLER
            const fadeOutSkeleton = (skeleton) => {
                if (!skeleton || skeleton.classList.contains('fade-out')) return;
                skeleton.classList.add('fade-out');
                setTimeout(() => {
                    skeleton.style.display = 'none';
                }, 300);
            };

            // 1. Logos Skeleton Loading Handler
            const setupImageSkeleton = (imgSelector, skeletonSelector) => {
                const img = document.querySelector(imgSelector);
                const skeleton = document.querySelector(skeletonSelector);
                if (img && skeleton) {
                    if (img.complete) {
                        img.classList.add('loaded');
                        fadeOutSkeleton(skeleton);
                    } else {
                        img.addEventListener('load', () => {
                            img.classList.add('loaded');
                            fadeOutSkeleton(skeleton);
                        });
                        img.addEventListener('error', () => {
                            fadeOutSkeleton(skeleton);
                        });
                    }
                }
            };
            setupImageSkeleton('.logo-img', '.logo-skeleton');
            setupImageSkeleton('.footer-logo', '.footer-skeleton');

            // 2. Videos Skeleton Loading Handler (Hero, Horizontal Cards, Vertical Reels)
            const setupVideoSkeleton = (videoEl, skeletonEl) => {
                if (!videoEl || !skeletonEl) return;
                
                const onVideoReady = () => {
                    fadeOutSkeleton(skeletonEl);
                };

                // Check if ready state is already high enough
                if (videoEl.readyState >= 2) {
                    onVideoReady();
                } else {
                    videoEl.addEventListener('loadeddata', onVideoReady);
                    videoEl.addEventListener('canplay', onVideoReady);
                    // Fallback to ensure it disappears if loading fails/times out
                    setTimeout(onVideoReady, 5000);
                }
            };

            // Hero Video
            const heroVideoEl = document.querySelector('.hero-video');
            const heroSkeletonEl = document.querySelector('.hero-skeleton');
            setupVideoSkeleton(heroVideoEl, heroSkeletonEl);

            // Horizontal Cards
            document.querySelectorAll('.h-video-card').forEach((card) => {
                const videoEl = card.querySelector('.h-vid');
                const skeletonEl = card.querySelector('.h-video-skeleton');
                setupVideoSkeleton(videoEl, skeletonEl);
            });

            // Vertical Reels
            document.querySelectorAll('.v-reel-card').forEach((card) => {
                const videoEl = card.querySelector('.v-vid');
                const skeletonEl = card.querySelector('.v-reel-skeleton');
                setupVideoSkeleton(videoEl, skeletonEl);
            });

});


// Block context menus on all videos to prevent downloading
document.querySelectorAll('video').forEach(video => {
  video.addEventListener('contextmenu', e => e.preventDefault());
});
