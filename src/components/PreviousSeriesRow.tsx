import { Link } from 'react-router-dom';
import type { Series } from '../api';
import { mediaUrl, placeholderCover, seriesUrl } from '../api';

interface Props {
  seriesList: Series[];
}

function formatSeriesDate(startDate: string): string {
  try {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(`${startDate}T12:00:00`));
  } catch {
    return startDate;
  }
}

function getSeriesCover(series: Series): string {
  return (
    series.coverImage ||
    series.heroImage ||
    series.episodes.find((ep) => ep.image)?.image ||
    ''
  );
}

function getSeriesTeaser(series: Series): string {
  return (series.subtitle || series.description || '').trim();
}

function PreviousSeriesCard({ series }: { series: Series }) {
  const cover = getSeriesCover(series);
  const teaser = getSeriesTeaser(series);
  const episodeCount = series.episodes?.length || 7;

  return (
    <Link
      to={seriesUrl(series)}
      className="group block flex-shrink-0 w-[44vw] max-w-[172px] sm:w-44 md:w-48 snap-start"
      aria-label={`${series.title} megnyitása`}
    >
      <article className="h-full rounded-2xl overflow-hidden bg-bg-card ring-1 ring-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out group-hover:scale-[1.04] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_24px_rgba(229,9,20,0.12)] group-hover:ring-accent/25 group-active:scale-[0.98]">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={cover ? mediaUrl(cover) : placeholderCover(series.title)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-text/90 border border-white/10">
            Befejezett
          </span>
          <div className="absolute bottom-0 inset-x-0 p-3 pt-8">
            <h3 className="text-sm sm:text-base font-bold leading-snug line-clamp-2 transition-colors duration-300 group-hover:text-accent">
              {series.title}
            </h3>
          </div>
        </div>

        <div className="px-3 py-2.5 border-t border-white/[0.04]">
          {teaser ? (
            <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 min-h-[2.5rem]">
              {teaser}
            </p>
          ) : (
            <p className="text-[11px] text-text-muted/60 min-h-[2.5rem]">Heti lelki sorozat</p>
          )}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/[0.04]">
            <span className="text-[10px] font-semibold text-text/80">{episodeCount} rész</span>
            <span className="text-[10px] text-text-muted truncate">{formatSeriesDate(series.startDate)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/** Netflix-szerű vízszintes sor — korábbi, lezárt hetek (a kiemelt sorozat nélkül). */
export default function PreviousSeriesRow({ seriesList }: Props) {
  if (!seriesList.length) return null;

  return (
    <section className="mt-14 sm:mt-16 mb-2" aria-labelledby="previous-series-heading">
      <div className="px-5 mb-4">
        <h2 id="previous-series-heading" className="text-lg sm:text-xl font-bold tracking-tight">
          Korábbi sorozatok
        </h2>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Bármikor visszanézheted a lezárt heteket
        </p>
      </div>

      <div
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-5 pb-4 snap-x snap-mandatory touch-pan-x overscroll-x-contain"
        role="list"
      >
        {seriesList.map((series) => (
          <div key={series.id} role="listitem">
            <PreviousSeriesCard series={series} />
          </div>
        ))}
      </div>
    </section>
  );
}
