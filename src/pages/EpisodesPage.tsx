import { useEffect, useState } from 'react';
import { fetchCurrent, EMPTY_SERIES_MESSAGE } from '../api';
import type { HomeResponse, Series } from '../api';
import EpisodeStripCard from '../components/EpisodeStripCard';
import WeeklyFinaleSection from '../components/WeeklyFinaleSection';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

function getEpisodeProgress(series: Series) {
  const unlocked = series.episodes.filter((e) => e.status !== 'locked').length;
  return Math.round((unlocked / 7) * 100);
}

export default function EpisodesPage() {
  const [home, setHome] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrent().then(setHome).catch(console.error).finally(() => setLoading(false));
  }, []);

  const series = home?.series;
  const isUpcoming = home?.phase === 'upcoming';

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!series || home?.phase === 'empty') {
    return (
      <div className="min-h-dvh pb-24 bg-bg">
        <Header />
        <div className="px-5 pt-8 text-center text-text-muted max-w-sm mx-auto leading-relaxed">
          {home?.message || EMPTY_SERIES_MESSAGE}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24 bg-bg">
      <Header />
      <main className="pt-6 px-5">
        {isUpcoming && (
          <p className="text-sm text-text-muted mb-4 rounded-xl border border-border bg-bg-card/50 px-4 py-3">
            Következő sorozat — indul: <strong>{series.startDate}</strong>
          </p>
        )}
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold mb-1">{series.title}</h1>
          <p className="text-text-muted text-sm">
            {isUpcoming ? 'Az epizódok a kezdő napon nyílnak meg.' : `${series.currentDay}. nap / ${series.totalDays} epizód`}
          </p>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2 snap-x snap-mandatory animate-fade-in-up">
          {series.episodes.map((episode) => (
            <div key={episode.day} className="snap-start">
              <EpisodeStripCard series={series} episode={episode} />
            </div>
          ))}
        </div>
        {!isUpcoming && (
          <div className="mt-4 h-1 bg-bg-card rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${getEpisodeProgress(series)}%` }} />
          </div>
        )}
      </main>
      {!isUpcoming && <WeeklyFinaleSection series={series} />}
      <BottomNav />
    </div>
  );
}
