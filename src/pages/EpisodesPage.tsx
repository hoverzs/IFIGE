import { useEffect, useState } from 'react';
import { fetchCurrent } from '../api';
import type { Series } from '../api';
import EpisodeStripCard from '../components/EpisodeStripCard';
import WeeklyFinaleSection from '../components/WeeklyFinaleSection';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

function getEpisodeProgress(series: Series) {
  const unlocked = series.episodes.filter((e) => e.status !== 'locked').length;
  return Math.round((unlocked / 7) * 100);
}

export default function EpisodesPage() {
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrent()
      .then(setSeries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-dvh pb-24 bg-bg">
        <Header />
        <div className="px-5 pt-8 text-center text-text-muted">Nincs aktív sorozat.</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24 bg-bg">
      <Header />

      <main className="pt-6 px-5">
        <div className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold mb-1">{series.title}</h1>
          <p className="text-text-muted text-sm">
            {series.currentDay}. nap / {series.totalDays} epizód
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2 snap-x snap-mandatory animate-fade-in-up">
          {series.episodes.map((episode) => (
            <div key={episode.day} className="snap-start">
              <EpisodeStripCard series={series} episode={episode} />
            </div>
          ))}
        </div>

        <div className="mt-4 h-1 bg-bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${getEpisodeProgress(series)}%` }}
          />
        </div>
      </main>

      <WeeklyFinaleSection series={series} />

      <BottomNav />
    </div>
  );
}
