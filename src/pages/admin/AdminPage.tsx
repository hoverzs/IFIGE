import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  deleteSeries,
  fetchAllSeries,
  getEpisodeEditStatus,
  mediaUrl,
  placeholderCover,
  SERIES_STATUS_LABELS,
} from '../../api';
import type { Series } from '../../api';
import Button from '../../components/Button';

export default function AdminPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetchAllSeries()
      .then(setSeriesList)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (e: React.MouseEvent, series: Series) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`„${series.title}” sorozat törlése? Ez nem vonható vissza.`)) return;
    try {
      await deleteSeries(series.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Törlési hiba');
    }
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-bg/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-text-muted hover:text-text transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold">Admin</h1>
        </div>
        <Button to="/admin/new" variant="primary" className="!px-4 !py-2 !text-xs">
          + Új sorozat
        </Button>
      </header>

      <main className="px-5 py-6 max-w-2xl mx-auto">
        <p className="text-text-muted text-sm mb-6">
          Heti sorozatok kézi feltöltése és szerkesztése.
        </p>

        {loading ? (
          <Spinner />
        ) : seriesList.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p className="mb-4">Még nincs sorozat.</p>
            <Button to="/admin/new">Első sorozat létrehozása</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {seriesList.map((series) => (
              <SeriesRow key={series.id} series={series} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SeriesRow({
  series,
  onDelete,
}: {
  series: Series;
  onDelete: (e: React.MouseEvent, s: Series) => void;
}) {
  const navigate = useNavigate();
  const doneCount = series.episodes.filter(
    (ep) => getEpisodeEditStatus(ep) === 'complete'
  ).length;

  return (
    <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
      <Link
        to={`/admin/series/${series.id}`}
        className="flex items-center gap-4 p-4 hover:bg-bg-elevated/50 transition-colors"
      >
        <div className="w-12 h-[4.5rem] rounded-lg overflow-hidden flex-shrink-0 bg-bg">
          <img
            src={series.coverImage ? mediaUrl(series.coverImage) : placeholderCover(series.title)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold truncate">{series.title || 'Névtelen sorozat'}</h3>
            <StatusBadge status={series.status} />
          </div>
          <p className="text-xs text-text-muted">
            {doneCount}/7 epizód kész · {series.startDate}
          </p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted flex-shrink-0">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>
      <div className="flex border-t border-border">
        <button
          type="button"
          onClick={() => navigate(`/admin/series/${series.id}`)}
          className="flex-1 py-2.5 text-xs font-medium text-text-muted hover:text-text transition-colors"
        >
          Szerkesztés
        </button>
        <button
          type="button"
          onClick={(e) => onDelete(e, series)}
          className="flex-1 py-2.5 text-xs font-medium text-accent hover:text-accent-hover border-l border-border transition-colors"
        >
          Törlés
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Series['status'] }) {
  const styles = {
    draft: 'bg-text-muted/20 text-text-muted',
    active: 'bg-accent/20 text-accent',
    archived: 'bg-bg-elevated text-text-muted border border-border',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status]}`}>
      {SERIES_STATUS_LABELS[status]}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
