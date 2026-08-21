import sys

with open('index.html', 'r') as f:
    content = f.read()

# Add fullscreen button to existing reels
fs_button = """
                <button class="v-btn v-fullscreen-btn" aria-label="Fullscreen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>"""

content = content.replace("""                  </svg>
                </button>
              </div>
              <div class="v-platform-badge">""", """                  </svg>
                </button>""" + fs_button + """
              </div>
              <div class="v-platform-badge">""")

# Add the 2 new videos
new_videos = """          </div>

          <!-- REEL 4: finla w -->
          <div class="v-reel-card reveal-element">
            <div class="v-reel-thumb">
              <video class="v-vid" src="assets/videos/finla w.mp4"
                muted loop playsinline preload="metadata"></video>
              <div class="v-reel-overlay"></div>
              <div class="v-reel-controls">
                <button class="v-btn v-play-pause" aria-label="Play Pause">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path class="v-pause" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    <path class="v-play" d="M8 5v14l11-7z" style="display:none"/>
                  </svg>
                </button>
                <button class="v-btn v-mute-btn" aria-label="Mute Unmute">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path class="v-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 
                      3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 
                      2.5-2.25 2.5-4.02z"/>
                    <path class="v-sound-off" style="display:none" 
                      d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 
                      2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 
                      2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 
                      5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 
                      5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 
                      1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 
                      21 19.73l-9-9L4.27 3zM11 5.27L9 7.27V9H7.27L11 
                      12.73V5.27z"/>
                  </svg>
                </button>
                <button class="v-btn v-fullscreen-btn" aria-label="Fullscreen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
              <div class="v-platform-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#C9A84C">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 
                    4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 
                    0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 
                    4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 
                    0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 
                    0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 
                    4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 
                    0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 
                    6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 
                    3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 
                    1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 
                    4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 
                    0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 
                    5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 
                    6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 
                    10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 
                    1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 
                    0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 
                    0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram Reel</span>
              </div>
            </div>
            <div class="v-reel-info">
              <h3 class="v-reel-title">Cinematic Edit</h3>
              <p class="v-reel-desc">Stunning visuals optimized for scroll.</p>
            </div>
          </div>

          <!-- REEL 5: garuda reel -->
          <div class="v-reel-card reveal-element">
            <div class="v-reel-thumb">
              <video class="v-vid" src="assets/videos/garuda reel .mp4"
                muted loop playsinline preload="metadata"></video>
              <div class="v-reel-overlay"></div>
              <div class="v-reel-controls">
                <button class="v-btn v-play-pause" aria-label="Play Pause">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path class="v-pause" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    <path class="v-play" d="M8 5v14l11-7z" style="display:none"/>
                  </svg>
                </button>
                <button class="v-btn v-mute-btn" aria-label="Mute Unmute">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path class="v-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 
                      3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 
                      2.5-2.25 2.5-4.02z"/>
                    <path class="v-sound-off" style="display:none" 
                      d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 
                      2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 
                      2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 
                      5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 
                      5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 
                      1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 
                      21 19.73l-9-9L4.27 3zM11 5.27L9 7.27V9H7.27L11 
                      12.73V5.27z"/>
                  </svg>
                </button>
                <button class="v-btn v-fullscreen-btn" aria-label="Fullscreen">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
              <div class="v-platform-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#C9A84C">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 
                    4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 
                    0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 
                    4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 
                    0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 
                    0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 
                    4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 
                    0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 
                    6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 
                    3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 
                    1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 
                    4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 
                    0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 
                    5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 
                    6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 
                    10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 
                    1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 
                    0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 
                    0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram Reel</span>
              </div>
            </div>
            <div class="v-reel-info">
              <h3 class="v-reel-title">Garuda Story</h3>
              <p class="v-reel-desc">High energy action reel.</p>
            </div>
          </div>"""

content = content.replace("""            </div>
          </div>

        </div>
      </div>
    </section>""", new_videos + """

        </div>
      </div>
    </section>""")

# Add fullscreen logic to JS
js_original = """  if (muteBtn) {
    muteBtn.addEventListener('click', e => {
      e.stopPropagation();
      vid.muted = !vid.muted;
      const soundOn  = muteBtn.querySelector('.v-sound-on');
      const soundOff = muteBtn.querySelector('.v-sound-off');
      if (soundOn)  soundOn.style.display  = vid.muted ? 'none' : '';
      if (soundOff) soundOff.style.display = vid.muted ? ''     : 'none';
    });
  }
});"""

js_new = """  const fsBtn = card.querySelector('.v-fullscreen-btn');

  if (muteBtn) {
    muteBtn.addEventListener('click', e => {
      e.stopPropagation();
      vid.muted = !vid.muted;
      const soundOn  = muteBtn.querySelector('.v-sound-on');
      const soundOff = muteBtn.querySelector('.v-sound-off');
      if (soundOn)  soundOn.style.display  = vid.muted ? 'none' : '';
      if (soundOff) soundOff.style.display = vid.muted ? ''     : 'none';
    });
  }

  if (fsBtn) {
    fsBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (vid.requestFullscreen) {
        vid.requestFullscreen();
      } else if (vid.webkitRequestFullscreen) { /* Safari */
        vid.webkitRequestFullscreen();
      } else if (vid.msRequestFullscreen) { /* IE11 */
        vid.msRequestFullscreen();
      }
    });
  }
});"""

content = content.replace(js_original, js_new)

with open('index.html', 'w') as f:
    f.write(content)
