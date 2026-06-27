import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSeries, getEpisodePublicMessage, seriesUrl } from '../api';
import type { Episode, Series } from '../api';
import EpisodeMedia from '../components/EpisodeMedia';
import ShareEpisodeButton from '../components/ShareEpisodeButton';
import ShareEpisodeSection from '../components/ShareEpisodeSection';

export default function EpisodePage() {
  const { slug, day } = useParams<{ slug: string; day: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetchSeries(slug).then((s) => {
      setSeries(s);
      setEpisode(s.episodes.find((e) => e.day === parseInt(day || '1', 10)) || null);
    }).catch(console.error).finally(() => setLoading(false));
  }, [slug, day]);

  if (loading) return <Spinner />;

  if (!series || !episode) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-text-muted">Epizód nem található.</p>
        <Link to="/" className="text-accent text-sm">Vissza</Link>
      </div>
    );
  }

  if (episode.status === 'locked') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{episode.day}. epizód</span>
        <h2 className="text-xl font-bold">{episode.title || 'Hamarosan'}</h2>
        <p className="text-text-muted text-sm">Ez az epizód még nem nyílt meg.</p>
        <Link to="/" className="text-accent text-sm">← Vissza</Link>
      </div>
    );
  }

  const contentMessage = getEpisodePublicMessage(episode);
  if (contentMessage) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{episode.day}. epizód</span>
        <h2 className="text-xl font-bold">{episode.title || `${episode.day}. rész`}</h2>
        <p className="text-text-muted text-sm max-w-sm">{contentMessage}</p>
        <Link to="/" className="text-accent text-sm">← Vissza</Link>
      </div>
    );
  }

  const dayNum = parseInt(day || '1', 10);
  const prevDay = dayNum > 1 ? dayNum - 1 : null;
  const nextEp = series.episodes.find((e) => e.day === dayNum + 1);
  const nextDay = nextEp && nextEp.status !== 'locked' ? dayNum + 1 : null;

  return (
    <div className="min-h-dvh bg-bg pb-10 overflow-x-hidden">
      <div className="sticky top-0 z-40 bg-bg/80 backdrop-blur border-b border-border px-5 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-bg/80 px-3 py-1.5 text-xs font-semibold text-text hover:border-accent/40 transition-colors"
          aria-label="Vissza a főoldalra"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Főoldal
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">{episode.day}. epizód</p>
          <h1 className="font-bold truncate">{episode.title}</h1>
        </div>
        <ShareEpisodeButton series={series} episode={episode} variant="compact" />
      </div>

      <div className="episode-hero relative w-full aspect-video sm:aspect-[2/1] max-h-[72dvh] bg-black">
        <EpisodeMedia
          episode={episode}
          variant="static"
          containerClassName="episode-hero__media"
          className="episode-hero__img"
        />
        <div className="episode-hero__fade" aria-hidden />
      </div>

      <article className="px-5 py-8 max-w-[680px] mx-auto space-y-8 animate-fade-in-up">
        {episode.scripture && (
          <section>
            <Label>Ige</Label>
            <p className="text-lg sm:text-xl font-medium text-accent leading-relaxed">{episode.scripture}</p>
          </section>
        )}
        {episode.thought && (
          <section>
            <Label>Gondolat</Label>
            <div className="text-[1.05rem] leading-[1.85] text-text/95 whitespace-pre-wrap">
              {episode.thought}
            </div>
          </section>
        )}
        {episode.question && (
          <section className="bg-bg-card rounded-2xl p-5 sm:p-6 border border-border">
            <Label>Kérdés</Label>
            <p className="text-[1.05rem] leading-[1.75] italic text-text/95">{episode.question}</p>
          </section>
        )}
        {episode.prayer && (
          <section className="bg-accent/10 rounded-2xl p-5 sm:p-6 border border-accent/20">
            <Label>Ima</Label>
            <p className="text-[1.05rem] leading-[1.75] whitespace-pre-wrap text-text/95">{episode.prayer}</p>
          </section>
        )}
        {episode.teaser && (
          <section className="border-l-2 border-accent/60 pl-5">
            <Label>Holnap</Label>
            <p className="text-text-muted italic leading-[1.75] whitespace-pre-wrap">{episode.teaser}</p>
          </section>
        )}

        <ShareEpisodeSection series={series} episode={episode} />

        <nav className="flex justify-between pt-6 border-t border-border">
          {prevDay ? <Link to={seriesUrl(series, `/episode/${prevDay}`)} className="text-sm text-text-muted hover:text-accent">← Előző</Link> : <span />}
          {nextDay ? <Link to={seriesUrl(series, `/episode/${nextDay}`)} className="text-sm font-semibold text-accent">Következő →</Link> : <span />}
        </nav>
      </article>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">{children}</h2>;
}

function Spinner() {
  return <div className="min-h-dvh flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
}
