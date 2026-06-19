import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSeries } from '../api';
import type { Series } from '../api';
import EpisodeStripCard from '../components/EpisodeStripCard';
import SeriesHeroImage from '../components/SeriesHeroImage';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export default function SeriesPage() {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchSeries(id)
      .then(setSeries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
        <Link to="/archive" className="text-accent text-sm">Vissza az archívumhoz</Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      <Header />

      <section className="relative">
        <div className="relative h-64">
          <SeriesHeroImage series={series} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 gradient-hero" />
        </div>

        <div className="relative -mt-16 px-5 animate-fade-in-up">
          <h1 className="text-2xl font-extrabold mb-1">{series.title}</h1>
          {series.biblicalBasis && (
            <p className="text-accent text-sm font-medium mb-1">{series.biblicalBasis}</p>
          )}
          {series.weeklyMessage && (
            <p className="text-text text-sm italic mb-2">„{series.weeklyMessage}"</p>
          )}
          <p className="text-text-muted text-sm mb-6">{series.description}</p>

          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2">
            {series.episodes.map((episode) => (
              <EpisodeStripCard key={episode.day} series={series} episode={episode} />
            ))}
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
