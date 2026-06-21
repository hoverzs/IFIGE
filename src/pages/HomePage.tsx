import { useEffect, useState } from 'react';
import { fetchCurrent, EMPTY_SERIES_MESSAGE } from '../api';
import type { CurrentResponse, Series } from '../api';
import Button from '../components/Button';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import EpisodeStripCard from '../components/EpisodeStripCard';
import WeeklyFinaleSection from '../components/WeeklyFinaleSection';
import SeriesHeroImage from '../components/SeriesHeroImage';

function getFeaturedEpisode(series: Series) {
  return (
    series.episodes.find((e) => e.status === 'current') ||
    series.episodes.find((e) => e.status === 'available') ||
    series.episodes[0]
  );
}

function getEpisodeProgress(series: Series) {
  const unlocked = series.episodes.filter((e) => e.status !== 'locked').length;
  return Math.round((unlocked / 7) * 100);
}

export default function HomePage() {
  const [current, setCurrent] = useState<CurrentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrent().then(setCurrent).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!current?.series || current.phase === 'empty') {
    return (
      <div className="min-h-dvh pb-24 bg-bg">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[50dvh] px-6 text-center">
          <p className="text-text-muted text-base max-w-sm leading-relaxed">
            {current?.message || EMPTY_SERIES_MESSAGE}
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const series = current.series;
  const isUpcoming = current.phase === 'upcoming';
  const featuredEpisode = getFeaturedEpisode(series);
  const heroImage = series.episodes[0]?.image || series.coverImage || series.heroImage;
  const unlockedCount = series.episodes.filter((e) => e.status !== 'locked').length;
  const statusLabel = isUpcoming
    ? `Következő sorozat · ${series.startDate}`
    : series.showAllEpisodes
      ? 'Teszt mód · mind a 7 epizód elérhető'
      : series.releaseMode === 'all'
        ? `${unlockedCount}/${series.totalDays} · Minden epizód elérhető`
        : `${series.currentDay}/${series.totalDays} · Heti sorozat`;

  return (
    <div className="min-h-dvh pb-24 bg-bg">
      <Header />

      {isUpcoming && (
        <div className="mx-5 mt-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-text/90">
          Ez a sorozat <strong>{series.startDate}</strong>-án indul. Az epizódok addig zároltak maradnak.
        </div>
      )}

      <section className="relative mx-auto mt-8 w-[88%] max-w-[1500px] sm:w-[90%]">
        <div className="relative h-[clamp(280px,52vw,540px)] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.06]">
          <SeriesHeroImage series={series} imageSrc={heroImage} />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-bg via-bg/70 to-black/25" />
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />

          <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 sm:p-10 lg:p-12 pb-7 sm:pb-9 max-w-3xl">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent mb-3">
              {statusLabel}
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-3 drop-shadow-2xl tracking-tight">
              {series.title}
            </h1>
            {(series.biblicalBasis || series.description) && (
              <p className="text-text/90 text-sm sm:text-base mb-3 max-w-xl line-clamp-2 leading-relaxed">
                {series.biblicalBasis || series.description}
              </p>
            )}
            {!isUpcoming && featuredEpisode && (
              <p className="text-white/90 text-sm sm:text-base font-medium mb-5">
                {featuredEpisode.status === 'current' ? 'Mai epizód: ' : 'Kezdd itt: '}
                <span className="text-accent">{featuredEpisode.title}</span>
              </p>
            )}

            {!isUpcoming && featuredEpisode && featuredEpisode.status !== 'locked' && (
              <Button
                to={`/series/${series.id}/episode/${featuredEpisode.day}`}
                className="w-full sm:w-auto max-w-[280px]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                {featuredEpisode.status === 'current' ? 'Mai epizód megnyitása' : 'Epizód megnyitása'}
              </Button>
            )}
          </div>
        </div>
      </section>

      {series.weeklyMessage && (
        <section className="w-[88%] sm:w-[90%] max-w-[1500px] mx-auto mt-8 sm:mt-10 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-3">A hét mondata</p>
          <blockquote className="border-l-2 border-accent/60 pl-5 sm:pl-6">
            <p className="text-base sm:text-lg italic text-text/90 leading-relaxed max-w-2xl">
              „{series.weeklyMessage}"
            </p>
          </blockquote>
        </section>
      )}

      <section className="mt-10 sm:mt-12">
        <div className="px-5 mb-3">
          <h2 className="text-base font-bold">Epizódok</h2>
          <p className="text-xs text-text-muted">{isUpcoming ? '7 napi epizód — hamarosan' : '7 napi epizód'}</p>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-2 snap-x">
          {series.episodes.map((ep) => (
            <div key={ep.day} className="snap-start">
              <EpisodeStripCard series={series} episode={ep} />
            </div>
          ))}
        </div>

        {!isUpcoming && (
          <div className="px-5 mt-3">
            <div className="h-1 bg-bg-card rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${getEpisodeProgress(series)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {!isUpcoming && <WeeklyFinaleSection series={series} />}

      <BottomNav />
    </div>
  );
}
