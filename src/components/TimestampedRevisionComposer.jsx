import React, { useState } from 'react';
import { 
  Send, 
  Clock, 
  Sparkles, 
  Plus, 
  X, 
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { parseRevisionTimestamp, formatRevisionWithTimestamp } from '../lib/db/revisions';

/**
 * Component to display a note that may contain a [TIMESTAMP:MM:SS] marker.
 */
export function RevisionNoteBadge({ noteText, className = '' }) {
  const { timestamp, note } = parseRevisionTimestamp(noteText);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {timestamp && (
        <div className="inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold tracking-wider shadow-sm">
          <Clock className="h-3 w-3 text-cyan-400" />
          <span>{timestamp}</span>
        </div>
      )}
      <span className="text-sm text-neutral-200 leading-relaxed break-words">
        {note || noteText}
      </span>
    </div>
  );
}

/**
 * Frame-by-frame Revision Composer with MM:SS timestamp picker.
 */
export default function TimestampedRevisionComposer({
  onSubmitNote,
  isSubmitting = false,
  placeholder = 'Describe your revision request or changes here...'
}) {
  const [note, setNote] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [showTimestampInput, setShowTimestampInput] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim() || isSubmitting) return;

    if (onSubmitNote) {
      onSubmitNote({
        note: note.trim(),
        timestamp: timestamp.trim() || null,
        formattedNote: formatRevisionWithTimestamp(timestamp, note)
      });
    }

    setNote('');
    setTimestamp('');
    setShowTimestampInput(false);
  };

  const handleQuickAdd = (timeStr) => {
    setTimestamp(timeStr);
    setShowTimestampInput(true);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
      <div className="relative rounded-xl bg-white/[0.03] border border-white/10 focus-within:border-cyan-500/40 focus-within:bg-white/[0.05] transition-all overflow-hidden">
        {/* TEXTAREA */}
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-3.5 pt-3 pb-2 text-sm text-white placeholder-neutral-500 outline-none resize-none"
        />

        {/* TIMESTAMP STRIP (IF ACTIVE) */}
        {showTimestampInput && (
          <div className="px-3 pb-2.5 pt-1 flex items-center gap-2 border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
              <Clock className="h-3.5 w-3.5" />
              <span>Timestamp:</span>
            </div>
            <input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="01:24"
              maxLength={8}
              className="w-20 px-2 py-0.5 rounded bg-black/40 border border-cyan-500/30 text-xs font-mono text-cyan-300 placeholder-neutral-600 outline-none focus:border-cyan-400"
            />
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-neutral-400">
              <button
                type="button"
                onClick={() => handleQuickAdd('00:30')}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300"
              >
                00:30
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('01:00')}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300"
              >
                01:00
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('02:00')}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300"
              >
                02:00
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setTimestamp('');
                setShowTimestampInput(false);
              }}
              className="ml-auto text-neutral-500 hover:text-neutral-300 p-0.5"
              title="Remove timestamp"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ACTION CONTROLS */}
      <div className="flex items-center justify-between gap-2">
        {!showTimestampInput ? (
          <button
            type="button"
            onClick={() => setShowTimestampInput(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-cyan-300 text-xs font-medium transition-colors"
          >
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Tag Video Time (MM:SS)</span>
          </button>
        ) : (
          <span className="text-[11px] text-neutral-500">
            Tagged to frame <strong className="text-cyan-300 font-mono">{timestamp || '00:00'}</strong>
          </span>
        )}

        <button
          type="submit"
          disabled={!note.trim() || isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-md shadow-blue-500/20 ml-auto"
        >
          {isSubmitting ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Send Revision Note</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
