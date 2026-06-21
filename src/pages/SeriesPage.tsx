import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSeries } from '../api';
import type { Series } from '../api';
import EpisodeStripCard from '../components/EpisodeStripCard';
import RecapStripCard from '../components/RecapStripCard';
import SeriesHeroImage from '../components/SeriesHeroImage';
import WeeklyFinaleSection from '../components/WeeklyFinaleSection';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function SeriesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetchSeries(slug).then(setSeries).catch(console.error).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <p className="text-text-muted">Sorozat nem található.</p>
        <Link to="/" className="text-accent text-sm">Vissza a főoldalra</Link>
      </div>
    );
  }

  const isUpcoming = series.computedStatus === 'upcoming' || series.displayPhase === 'upcoming';
  const isArchived = series.computedStatus === 'archived';

  return (
    <div className="min-h-dvh pb-24 bg-bg">
      <Header />

      <section className="relative mx-auto mt-6 w-[92%] max-w-[1200px]">
        <div className="relative h-[clamp(220px,45vw,420px)] rounded-3xl overflow-hidden ring-1 ring-white/[0.06]">
          <SeriesHeroImage series={series} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-black/30" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
            {isUpcoming && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Hamarosan · {series.startDate}</span>
            )}
            {isArchived && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">Lezárt sorozat</span>
            )}
            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-2">{series.title}</h1>
            {series.subtitle && (
              <p className="text-text/90 text-sm sm:text-base mb-3">{series.subtitle}</p>
            )}
            {series.description && (
              <p className="text-text-muted text-sm line-clamp-3">{series.description}</p>
            )}
          </div>
        </div>
      </section>

      {(series.weeklySentence || series.weeklyMessage) && (
        <section className="w-[92%] max-w-[1200px] mx-auto mt-8 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-3">A hét mondata</p>
          <blockquote className="border-l-2 border-accent/60 pl-5">
            <p className="text-base italic text-text/90 leading-relaxed max-w-2xl">
              „{series.weeklySentence || series.weeklyMessage}"
            </p>
          </blockquote>
        </section>
      )}

      <section className="mt-10 px-5">
        <h2 className="text-base font-bold mb-1">Epizódok</h2>
        <p className="text-xs text-text-muted mb-4">7 napi epizód</p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2 snap-x">
          {series.episodes.map((episode) => (
            <div key={episode.day} className="snap-start">
              <EpisodeStripCard series={series} episode={episode} />
            </div>
          ))}
          <div className="snap-start">
            <RecapStripCard series={series} />
          </div>
        </div>
      </section>

      {!isUpcoming && <WeeklyFinaleSection series={series} />}

      <BottomNav />
    </div>
  );
}
