import { useEffect, useState } from 'react';
import { fetchPastSeries, fetchCurrent } from '../api';
import type { Series } from '../api';
import { SeriesCard } from '../components/EpisodeCard';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function ArchivePage() {
  const [past, setPast] = useState<Series[]>([]);
  const [current, setCurrent] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPastSeries(), fetchCurrent()])
      .then(([pastSeries, currentSeries]) => {
        setPast(pastSeries);
        setCurrent(currentSeries);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completedCurrent =
    current?.isComplete ? [current] : [];
  const allPast = [...completedCurrent, ...past.filter((p) => p.id !== current?.id)];

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      <Header />

      <main className="pt-5 px-5">
        <h1 className="text-2xl font-extrabold mb-1 animate-fade-in-up">Korábbi sorozatok</h1>
        <p className="text-text-muted text-sm mb-6">
          Fedezd fel a már lezárult heti sorozatokat
        </p>

        {allPast.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <p className="mb-2">Még nincs archivált sorozat.</p>
            <p className="text-sm">Az első hét után itt jelennek meg.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-5 px-5 animate-fade-in-up">
            {allPast.map((series) => (
              <SeriesCard key={series.id} series={series} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
