import { useState } from 'react';
import type { Episode, Series } from '../api';
import { shareEpisode } from '../api';

interface Props {
  series: Series;
  episode: Episode;
  variant?: 'icon' | 'button';
  className?: string;
}

export default function ShareEpisodeButton({ series, episode, variant = 'icon', className = '' }: Props) {
  const [status, setStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = async () => {
    try {
      const result = await shareEpisode(series, episode);
      if (result === 'copied') {
        setStatus('copied');
        window.setTimeout(() => setStatus('idle'), 2500);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      alert(err instanceof Error ? err.message : 'Megosztási hiba');
    }
  };

  const label = status === 'copied' ? 'Másolva!' : 'Megosztás';

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleShare}
        className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.97] border border-border hover:border-accent/40 text-text px-6 py-3.5 text-sm w-full sm:w-auto max-w-[280px] mt-3 ${className}`}
      >
        <ShareIcon />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label}
      title={label}
      className={`flex-shrink-0 w-9 h-9 rounded-full border border-border bg-bg/80 flex items-center justify-center text-text-muted hover:text-text hover:border-accent/40 transition-colors ${className}`}
    >
      {status === 'copied' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <ShareIcon />
      )}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51 15.42 17.49" />
      <path d="M15.41 6.51 8.59 10.49" />
    </svg>
  );
}
