/**
 * YouTube Utility Helper
 * Parses YouTube embed code (iframe), standard URLs, Shorts, and IDs.
 * Auto-detects aspect ratio (9:16 vertical vs 16:9 horizontal) and generates
 * optimized embed URLs and thumbnail posters.
 */

export function parseYouTubeInput(input, preferredAspectRatio = null) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  let videoId = null;
  let detectedAspectRatio = preferredAspectRatio || null;

  // 1. Check if input is an <iframe> embed snippet
  if (trimmed.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    const widthMatch = trimmed.match(/width=["']?(\d+)["']?/i);
    const heightMatch = trimmed.match(/height=["']?(\d+)["']?/i);

    if (widthMatch && heightMatch && !detectedAspectRatio) {
      const w = parseInt(widthMatch[1], 10);
      const h = parseInt(heightMatch[1], 10);
      if (h > w) {
        detectedAspectRatio = '9/16';
      } else {
        detectedAspectRatio = '16/9';
      }
    }

    if (srcMatch && srcMatch[1]) {
      return parseYouTubeInput(srcMatch[1], detectedAspectRatio);
    }
  }

  // 2. YouTube Shorts (https://www.youtube.com/shorts/VIDEO_ID)
  const shortsMatch = trimmed.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch) {
    videoId = shortsMatch[1];
    if (!detectedAspectRatio) detectedAspectRatio = '9/16';
  }

  // 3. YouTube Embed URL (https://www.youtube.com/embed/VIDEO_ID)
  if (!videoId) {
    const embedMatch = trimmed.match(/(?:youtube(?:-nocookie)?\.com\/embed\/)([a-zA-Z0-9_-]{11})/i);
    if (embedMatch) {
      videoId = embedMatch[1];
    }
  }

  // 4. Standard watch URL (https://www.youtube.com/watch?v=VIDEO_ID)
  if (!videoId) {
    const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/i);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
  }

  // 5. Shortlink (https://youtu.be/VIDEO_ID)
  if (!videoId) {
    const shortMatch = trimmed.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) {
      videoId = shortMatch[1];
    }
  }

  // 6. Direct Video ID (11 alphanumeric characters)
  if (!videoId && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    videoId = trimmed;
  }

  if (!videoId) {
    return null;
  }

  const finalAspectRatio = detectedAspectRatio || '16/9';

  return {
    videoId,
    aspectRatio: finalAspectRatio,
    isVertical: finalAspectRatio === '9/16',
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    maxresThumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  };
}

/**
 * Builds an optimized YouTube embed URL
 */
export function buildYouTubeEmbedUrl(videoId, options = {}) {
  const {
    autoplay = true,
    mute = true,
    loop = true,
    controls = true,
    playsinline = true
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: mute ? '1' : '0',
    loop: loop ? '1' : '0',
    playlist: videoId, // Required for loop=1 to repeat single video
    controls: controls ? '1' : '0',
    playsinline: playsinline ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1'
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
