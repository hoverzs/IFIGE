import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSeries, mediaUrl } from '../api';
import type { Series } from '../api';
import LiveImage from '../components/LiveImage';

export default function RecapPage() {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchSeries(id).then(setSeries).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (!series) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-text-muted">
        Sorozat nem található.
      </div>
    );
  }

  const locked = series.recapStatus === 'locked' && series.status !== 'draft';

  if (locked) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h2 className="text-xl font-bold">Heti finálé</h2>
        <p className="text-text-muted text-sm">A hét lezárulta után válik elérhetővé.</p>
        <Link to="/" className="text-accent text-sm">← Vissza</Link>
      </div>
    );
  }

  const recap = series.weeklyRecap;
  const weekImages = series.episodes.filter((ep) => ep.image);

  return (
    <div className="min-h-dvh bg-bg pb-10">
      <div className="sticky top-0 z-40 bg-bg/80 backdrop-blur border-b border-border px-5 py-3 flex items-center gap-3">
        <Link to="/" className="text-text-muted hover:text-text">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Heti finálé</p>
          <h1 className="font-bold">{recap.title || series.title}</h1>
        </div>
      </div>

      {recap.video ? (
        <div className="bg-black">
          <video
            src={mediaUrl(recap.video)}
            controls
            playsInline
            className="w-full max-h-[50dvh] mx-auto"
          />
        </div>
      ) : weekImages.length > 0 ? (
        <div className="relative h-[40dvh] sm:h-[45dvh] overflow-hidden">
          <div className="absolute inset-0 flex">
            {weekImages.slice(0, 7).map((ep) => (
              <div key={ep.day} className="relative flex-1 min-w-0 border-r border-bg/50 last:border-0 overflow-hidden">
                <LiveImage
                  src={ep.image}
                  alt=""
                  seed={ep.day}
                  variant="breathe"
                  atmosphere={false}
                  containerClassName="absolute inset-0 h-full w-full opacity-90"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
        </div>
      ) : (
        <div className="h-32 bg-bg-card flex items-center justify-center text-text-muted text-sm">
          A hét képei még nem érhetők el
        </div>
      )}

      {recap.text ? (
        <article className="px-5 py-8 max-w-2xl mx-auto">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-3">Narráció</h2>
          <p className="leading-relaxed text-lg whitespace-pre-wrap">{recap.text}</p>
        </article>
      ) : (
        <div className="px-5 py-12 text-center text-text-muted text-sm">
          Még nincs feltöltve narráció szöveg.
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return <div className="min-h-dvh flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
}
