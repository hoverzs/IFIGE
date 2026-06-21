import { Link } from 'react-router-dom';
import type { Series } from '../api';
import { mediaUrl } from '../api';
import Button from './Button';

interface Props {
  series: Series;
}

function getFinalePreviewImage(series: Series): string {
  const day7 = series.episodes.find((ep) => ep.day === 7)?.image;
  if (day7) return day7;
  const lastWithImage = [...series.episodes].reverse().find((ep) => ep.image)?.image;
  if (lastWithImage) return lastWithImage;
  if (series.coverImage) return series.coverImage;
  return series.episodes.find((ep) => ep.image)?.image || '';
}

export default function WeeklyFinaleSection({ series }: Props) {
  const recap = series.weeklyRecap;
  const hasVideo = !!recap.video;
  const hasNarration = !!recap.text?.trim();
  const recapOpen = series.recapStatus === 'available';
  const recapReady = !recap.contentStatus || recap.contentStatus === 'complete';
  const previewImage = getFinalePreviewImage(series);

  return (
    <section className="px-5 mt-10">
      <h2 className="text-base font-bold mb-0.5">Heti finálé</h2>
      <p className="text-xs text-text-muted mb-4">A hét lezáró videója és narrációja — nem epizód</p>

      <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-bg-card shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        {previewImage ? (
          <div className="relative h-36 sm:h-44 overflow-hidden">
            <img
              src={mediaUrl(previewImage)}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/70 to-black/20" />
            {hasVideo && recapOpen && (
              <Link
                to={`/series/${series.id}/recap`}
                className="absolute inset-0 flex items-center justify-center group"
                aria-label="Heti finálé lejátszása"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/90 shadow-lg transition-transform group-hover:scale-105">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </Link>
            )}
          </div>
        ) : (
          <div className="relative h-28 sm:h-32 bg-bg flex items-center justify-center border-b border-border/40">
            <span className="text-xs text-text-muted">A hét képei hamarosan</span>
          </div>
        )}

        <div className="p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">Heti finálé</p>
          <h3 className="text-xl font-bold mb-2">{recap.title || series.title}</h3>
          <p className="text-sm text-text-muted mb-4">
            {series.description || 'A hét képeiből és narrációból készülő vasárnapi videó.'}
          </p>

          {!hasVideo && (
            <p className="text-sm text-text-muted/80 italic mb-4">A heti videó még nem készült el.</p>
          )}

          <div className="flex flex-wrap gap-3">
            {hasVideo && recapOpen && recapReady ? (
              <Button to={`/series/${series.id}/recap`} className="!text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                Lejátszás
              </Button>
            ) : hasVideo && recapOpen && !recapReady ? (
              <span className="text-sm text-text-muted px-4 py-2 rounded-full border border-border">Hamarosan elérhető</span>
            ) : hasVideo && !recapOpen ? (
              <span className="text-sm text-text-muted px-4 py-2 rounded-full border border-border">
                Vasárnap 16:00 után{series.recapPublishDate ? ` (${series.recapPublishDate})` : ''}
              </span>
            ) : null}

            {hasNarration && recapOpen && recapReady && (
              <Link
                to={`/series/${series.id}/recap`}
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover px-4 py-2 rounded-full border border-accent/30 hover:border-accent/60 transition-colors"
              >
                Narráció megnyitása
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
