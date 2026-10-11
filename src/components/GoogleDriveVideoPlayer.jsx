import React, { useState, useMemo, useEffect } from 'react';
import { 
  Play, 
  ExternalLink, 
  AlertCircle, 
  Maximize2, 
  Film, 
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

/**
 * Extract Google Drive file ID from various link formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/file/d/FILE_ID/preview
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - Raw Google Drive ID strings
 */
export function extractGoogleDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Match /file/d/{ID}
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Match id={ID} query param
  const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idQueryMatch && idQueryMatch[1]) {
    return idQueryMatch[1];
  }

  // If already a clean 25+ character alphanumeric ID
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export default function GoogleDriveVideoPlayer({
  videoUrl,
  driveUrl,
  url,
  title = 'Project Video Preview',
  aspectRatio = '16/9',
  onCurrentTimeChange = null,
  showControlsBar = true
}) {
  const effectiveUrl = videoUrl || driveUrl || url;
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const driveId = useMemo(() => extractGoogleDriveId(effectiveUrl), [effectiveUrl]);
  const isDirectVideo = useMemo(() => {
    if (!effectiveUrl) return false;
    return /\.(mp4|webm|ogg|mov)($|\?)/i.test(effectiveUrl);
  }, [effectiveUrl]);

  const embedUrl = useMemo(() => {
    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/preview`;
    }
    return null;
  }, [driveId]);

  // Safety fallback: dismiss loading skeleton after 2.5s so iframe interaction is never permanently covered
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [embedUrl, effectiveUrl]);

  if (!effectiveUrl) {
    return (
      <div 
        style={{
          width: '100%',
          minHeight: '160px',
          maxHeight: '220px',
          borderRadius: '12px',
          backgroundColor: '#090A0F',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#9CA3AF'
        }}
      >
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', color: '#6B7280' }}>
          <Film className="h-5 w-5" />
        </div>
        <p style={{ fontSize: '0.86rem', fontWeight: 600, color: '#E5E7EB', margin: 0 }}>No Video Deliverable Uploaded Yet</p>
        <p style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '4px', maxWidth: '340px' }}>
          Once your editor uploads the video cut, your embedded preview player will display here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-[#07080C] border border-white/10 overflow-hidden shadow-2xl flex flex-col group">
      {/* TOP HEADER CONTROLS BAR */}
      {showControlsBar && (
        <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
              {title}
            </span>
            {driveId && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-medium">
                Google Drive 4K Stream
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={effectiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors text-[11px] font-medium"
              title="Open master file in new tab"
            >
              <span>Open in Drive</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* VIDEO PLAYER CONTAINER */}
      <div 
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspectRatio === '9/16' ? '9 / 16' : '16 / 9',
          minHeight: '240px',
          maxHeight: aspectRatio === '9/16' ? '560px' : '440px',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Loading Spinner Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#090A0F] flex flex-col items-center justify-center z-10 text-neutral-400 pointer-events-none">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
            <p className="text-xs text-neutral-300 font-medium">Loading Google Drive Preview...</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Buffering video stream</p>
          </div>
        )}

        {/* EMBEDDED GOOGLE DRIVE IFRAME */}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="w-full h-full border-0 absolute inset-0 z-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        ) : isDirectVideo ? (
          <video
            src={effectiveUrl}
            controls
            className="w-full h-full object-contain"
            onLoadedData={() => setIsLoading(false)}
          />
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
            <h4 className="text-sm font-semibold text-white">External Video Link</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              This link is hosted externally. You can preview it directly in your browser.
            </p>
            <a
              href={effectiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/20"
            >
              <span>Watch Video Cut</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* FOOTER NOTICE */}
      <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-neutral-400" />
          <span>Full frame preview active</span>
        </span>
        <span className="text-[10px] text-neutral-500">
          Tip: Set Google Drive link to "Anyone with link can view"
        </span>
      </div>
    </div>
  );
}
