import { Link } from 'react-router-dom';
import type { Episode, Series } from '../api';
import { mediaUrl, placeholderCover, seriesUrl } from '../api';
import { EpisodeThumbnail } from './EpisodeMedia';

interface Props {
  series: Series;
  episode: Episode;
}

export default function EpisodeCard({ series, episode }: Props) {
  const isLocked = episode.status === 'locked';
  const isCurrent = episode.status === 'current';

  const cardContent = (
    <div
      className={`relative rounded-2xl overflow-hidden aspect-[4/3] transition-transform ${
        isLocked ? 'opacity-60' : 'active:scale-[0.98]'
      } ${isCurrent ? 'ring-2 ring-accent pulse-current' : ''}`}
    >
      <EpisodeThumbnail
        episode={episode}
        containerClassName={`absolute inset-0 ${isLocked ? 'blur-sm brightness-75' : ''}`}
      />
      <div className="absolute inset-0 gradient-card" />
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <span className="text-xs font-semibold text-accent mb-1">
          {episode.day}. rész
        </span>
        <h3 className="text-base font-bold leading-tight">
          {isLocked ? 'Hamarosan' : episode.title}
        </h3>
        {isCurrent && (
          <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-accent uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Mai rész
          </span>
        )}
      </div>
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-bg/80 backdrop-blur flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );

  if (isLocked) return cardContent;

  return (
    <Link to={seriesUrl(series, `/episode/${episode.day}`)}>
      {cardContent}
    </Link>
  );
}

export function SeriesCard({ series, badge }: { series: Series; badge?: string }) {
  const image = series.coverImage || series.heroImage || series.episodes[0]?.image;
  return (
    <Link
      to={seriesUrl(series)}
      className="flex-shrink-0 w-36 sm:w-44 group active:scale-[0.97] transition-transform"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[2/3] glow-accent">
        <img
          src={image ? mediaUrl(image) : placeholderCover(series.title)}
          alt={series.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 gradient-card" />
        {badge && (
          <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/90 text-white">
            {badge}
          </span>
        )}
        <div className="absolute bottom-0 inset-x-0 p-3">
          <h3 className="text-sm font-bold leading-tight line-clamp-2">
            {series.title}
          </h3>
          {series.subtitle && (
            <p className="text-[10px] text-text-muted mt-1 line-clamp-2">{series.subtitle}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
