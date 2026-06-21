import { Link } from 'react-router-dom';
import type { Episode, Series } from '../api';
import { seriesUrl } from '../api';
import { EpisodeThumbnail } from './EpisodeMedia';

interface Props {
  series: Series;
  episode: Episode;
}

export default function EpisodeStripCard({ series, episode }: Props) {
  const isLocked = episode.status === 'locked';
  const isCurrent = episode.status === 'current';
  const isPast = episode.status === 'available' && series.releaseMode !== 'all' && !series.showAllEpisodes;

  const card = (
    <div
      className={`group relative flex-shrink-0 w-[140px] sm:w-[160px] rounded-xl overflow-hidden transition-transform ${
        isLocked ? 'opacity-80' : 'active:scale-[0.97] hover:scale-[1.02]'
      } ${isCurrent ? 'ring-2 ring-accent pulse-current scale-[1.02]' : ''}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <EpisodeThumbnail
          episode={episode}
          containerClassName={`absolute inset-0 ${isLocked ? 'brightness-[0.72] saturate-[0.75]' : ''} ${isPast ? 'brightness-90' : ''}`}
        />
        <div className={`absolute inset-0 gradient-card ${isLocked ? 'opacity-70' : ''}`} />

        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur ${
            isCurrent ? 'bg-accent text-white' : 'bg-black/50 text-text'
          }`}>
            {episode.day}. rész
          </span>
        </div>

        <div className="absolute top-2 right-2">
          {isPast && <CheckBadge />}
          {isCurrent && <LiveBadge />}
          {!isLocked && !isPast && !isCurrent && <LiveBadge />}
          {isLocked && <LockBadge />}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3">
          <h3 className="text-xs font-bold leading-snug line-clamp-2 text-text drop-shadow-sm">
            {episode.title || `${episode.day}. rész`}
          </h3>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-accent">
              <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
              Mai rész
            </span>
          )}
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/15">
            <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLocked) return card;

  return (
    <Link to={seriesUrl(series, `/episode/${episode.day}`)}>
      {card}
    </Link>
  );
}

function CheckBadge() {
  return (
    <div className="w-6 h-6 rounded-full bg-green-500/90 flex items-center justify-center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
}

function LockBadge() {
  return (
    <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    </div>
  );
}
