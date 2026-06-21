import { Link } from 'react-router-dom';
import type { Series } from '../api';
import { seriesUrl } from '../api';
import LiveImage from './LiveImage';

interface Props {
  series: Series;
}

export default function RecapStripCard({ series }: Props) {
  const locked = series.recapStatus === 'locked';
  const recap = series.weeklyRecap;
  const previewImage = series.episodes.find((ep) => ep.image)?.image;

  const card = (
    <div
      className={`group relative flex-shrink-0 w-[140px] sm:w-[160px] rounded-xl overflow-hidden transition-transform ${
        locked ? 'opacity-55' : 'active:scale-[0.97] ring-2 ring-accent/30'
      }`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {previewImage ? (
          <LiveImage
            src={previewImage}
            variant="breathe"
            atmosphere={false}
            containerClassName={`absolute inset-0 h-full w-full ${locked ? 'blur-[2px] grayscale-[30%]' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 bg-bg-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/20" />

        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur bg-accent/90 text-white">
            Heti finálé
          </span>
        </div>

        <div className="absolute top-2 right-2">
          {locked ? <LockBadge /> : <PlayBadge />}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-3">
          <p className="text-[9px] font-bold uppercase tracking-wider text-accent mb-1">Heti finálé</p>
          <h3 className="text-xs font-bold leading-tight line-clamp-2">
            {recap.title || series.title}
          </h3>
        </div>

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/25">
            <div className="w-9 h-9 rounded-full bg-bg/80 backdrop-blur flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 018 0v4" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (locked) return card;

  return (
    <Link to={seriesUrl(series, '/recap')}>
      {card}
    </Link>
  );
}

function PlayBadge() {
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
    <div className="w-6 h-6 rounded-full bg-bg/80 backdrop-blur flex items-center justify-center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 018 0v4" />
      </svg>
    </div>
  );
}
