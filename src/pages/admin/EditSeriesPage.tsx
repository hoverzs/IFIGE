import { useEffect, useState } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';

import {

  deleteSeries, fetchSeries, updateSeries, updateEpisode,
  fetchAppConfig, updateAppConfig,
  episodeFormDataFrom, getEpisodeEditStatus, getRecapEditStatus, getSeriesReadiness, EDIT_STATUS_LABELS,

} from '../../api';

import type { Episode, Series } from '../../api';

import MediaUpload from '../../components/MediaUpload';

import EpisodeEditorModal from '../../components/EpisodeEditorModal';

import RecapEditorModal from '../../components/RecapEditorModal';

import { EpisodeThumbnail } from '../../components/EpisodeMedia';

import Button from '../../components/Button';



export default function EditSeriesPage() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [series, setSeries] = useState<Series | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [saving, setSaving] = useState(false);

  const [editingDay, setEditingDay] = useState<number | null>(null);

  const [recapOpen, setRecapOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);



  const [title, setTitle] = useState('');

  const [description, setDescription] = useState('');

  const [biblicalBasis, setBiblicalBasis] = useState('');

  const [weeklyMessage, setWeeklyMessage] = useState('');

  const [startDate, setStartDate] = useState('');

  const [releaseMode, setReleaseMode] = useState<Series['releaseMode']>('daily');

  const [status, setStatus] = useState<Series['status']>('draft');

  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [coverPreview, setCoverPreview] = useState('');

  const [removeCover, setRemoveCover] = useState(false);
  const [showAllEpisodes, setShowAllEpisodes] = useState(true);

  useEffect(() => {
    fetchAppConfig().then((c) => setShowAllEpisodes(c.showAllEpisodes)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Érvénytelen sorozat azonosító');
      return;
    }

    setLoading(true);
    setError('');

    fetchSeries(id)
      .then((s) => {
        setSeries(s);
        setTitle(s.title);
        setDescription(s.description);
        setBiblicalBasis(s.biblicalBasis);
        setWeeklyMessage(s.weeklyMessage);
        setStartDate(s.startDate);
        setReleaseMode(s.releaseMode || 'daily');
        setStatus(s.status);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Betöltési hiba'))
      .finally(() => setLoading(false));
  }, [id]);



  const saveAppConfig = async () => {
    try {
      await updateAppConfig({ showAllEpisodes });
      if (id) {
        const refreshed = await fetchSeries(id);
        setSeries(refreshed);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Beállítás mentési hiba');
    }
  };

  const saveSeries = async () => {

    if (!id) return;

    setSaving(true);

    try {

      const fd = new FormData();

      fd.append('title', title);

      fd.append('description', description);

      fd.append('biblicalBasis', biblicalBasis);

      fd.append('weeklyMessage', weeklyMessage);

      fd.append('startDate', startDate);

      fd.append('releaseMode', releaseMode || 'daily');

      fd.append('status', status);

      if (coverFile) fd.append('coverImage', coverFile);

      if (removeCover) fd.append('removeCover', 'true');

      const updated = await updateSeries(id, fd);

      setSeries(updated);

      setCoverFile(null);

      setCoverPreview('');

      setRemoveCover(false);

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Mentési hiba');

    } finally {

      setSaving(false);

    }

  };



  const saveEpisodeTitle = async (day: number, newTitle: string) => {

    if (!id || !series) return;

    const ep = series.episodes.find((e) => e.day === day);

    if (!ep || ep.title === newTitle) return;

    try {

      const updated = await updateEpisode(id, day, episodeFormDataFrom(ep, { title: newTitle }));

      setSeries(updated);

    } catch (err) {

      alert(err instanceof Error ? err.message : 'Cím mentési hiba');

    }

  };



  if (loading) return <Spinner />;

  if (error || !series) {

    return (

      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">

        <p className="text-text-muted">{error || 'Sorozat nem található'}</p>

        <Link to="/admin" className="text-accent text-sm">← Vissza az adminhoz</Link>

      </div>

    );

  }



  const editingEpisode = editingDay ? series.episodes.find((e) => e.day === editingDay) : null;

  const readiness = getSeriesReadiness(series);

  const recapStatus = getRecapEditStatus(series.weeklyRecap);



  return (

    <div className="min-h-dvh bg-bg pb-10">

      <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-border px-5 py-3">

        <div className="flex items-center gap-3 mb-3">

          <Link to="/admin" className="text-text-muted hover:text-text">

            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>

          </Link>

          <button type="button" onClick={() => setSettingsOpen((o) => !o)} className="ml-auto text-xs px-3 py-1.5 rounded-full border border-border hover:border-accent/40">

            {settingsOpen ? '← Storyboard' : 'Beállítások'}

          </button>

        </div>



        {!settingsOpen && (

          <div className="flex gap-2">

            <input

              className="input flex-1 font-bold text-lg !py-2"

              value={title}

              onChange={(e) => setTitle(e.target.value)}

              placeholder="Sorozat címe"

            />

            <Button onClick={saveSeries} disabled={saving} className="!px-4 shrink-0">

              {saving ? '…' : 'Mentés'}

            </Button>

          </div>

        )}

      </header>



      {settingsOpen ? (

        <div className="px-5 py-6 max-w-2xl mx-auto space-y-4 animate-fade-in-up">

          <Field label="Sorozat címe">

            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

          </Field>

          <Field label="Bibliai alap">

            <input className="input" value={biblicalBasis} onChange={(e) => setBiblicalBasis(e.target.value)} placeholder="pl. Péter tagadása (Lk 22; Jn 21)" />

          </Field>

          <Field label="Heti üzenet (központi mondat)">

            <textarea className="input resize-none" rows={2} value={weeklyMessage} onChange={(e) => setWeeklyMessage(e.target.value)} />

          </Field>

          <Field label="Rövid leírás">

            <textarea className="input resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

          </Field>

          <div className="grid grid-cols-2 gap-3">

            <Field label="Kezdődátum">

              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

            </Field>

            <Field label="Megjelenés">

              <select className="input" value={releaseMode || 'daily'} onChange={(e) => setReleaseMode(e.target.value as Series['releaseMode'])}>

                <option value="daily">Naponta egy rész</option>

                <option value="all">Mind azonnal elérhető</option>

              </select>

            </Field>

          </div>

          <Field label="Státusz">

            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Series['status'])}>

              <option value="draft">Vázlat</option>

              <option value="active">Aktív</option>

              <option value="archived">Archív</option>

            </select>

          </Field>

          <Field label="Teszt mód (fejlesztői)">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllEpisodes}
                onChange={(e) => setShowAllEpisodes(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm">showAllEpisodes — mind a 7 epizód kattintható</span>
            </label>
            <p className="text-xs text-text-muted mt-1.5">Prototípus teszteléshez. Később kikapcsolható.</p>
            <Button onClick={saveAppConfig} variant="ghost" className="mt-2 !text-sm">Teszt mód mentése</Button>
          </Field>

          <MediaUpload

            label="Főoldal borítókép (opcionális)"

            currentUrl={removeCover ? '' : series.coverImage}

            previewUrl={coverPreview}

            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"

            aspectClass="aspect-video max-w-full"

            onSelect={(f) => { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); setRemoveCover(false); }}

            onRemove={() => { setCoverFile(null); setCoverPreview(''); setRemoveCover(true); }}

            hint="Ha üres, az 1. epizód képe jelenik meg a főoldalon"

          />

          <div className="flex gap-2 pt-2">

            <Button onClick={saveSeries} disabled={saving} className="flex-1">Mentés</Button>

            <Button onClick={async () => { if (confirm('Törlöd a sorozatot?')) { await deleteSeries(id!); navigate('/admin'); } }} variant="ghost" className="text-accent">Törlés</Button>

          </div>

        </div>

      ) : (

        <div className="animate-fade-in-up">

          {weeklyMessage && (

            <section className="mx-5 mt-5 rounded-2xl border border-accent/30 bg-accent/5 p-5">

              <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">A hét központi mondata</p>

              <p className="text-base sm:text-lg italic leading-relaxed">„{weeklyMessage}"</p>

            </section>

          )}



          <section className="mx-5 mt-5 rounded-xl border border-border bg-bg-card/50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Állapot</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between gap-4">
                <span className="text-text-muted">Sorozat kész</span>
                <span className="font-medium">{readiness.episodesComplete === 7 ? 'Igen' : 'Még nem'}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-text-muted">7 epizód</span>
                <span className="font-medium">{readiness.episodesComplete}/7</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-text-muted">Heti videó</span>
                <span className="font-medium">{readiness.recapVideo ? 'Feltöltve' : 'Hiányzik'}</span>
              </li>
            </ul>
          </section>



          <section className="px-5 pt-6">

            <h2 className="text-lg font-bold mb-1">7 napi epizód</h2>

            <p className="text-xs text-text-muted mb-4">Kattints a kártyára a tartalom szerkesztéséhez</p>



            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-2 snap-x">

              {series.episodes.map((ep) => (

                <EpisodeCard key={ep.day} episode={ep} onOpen={() => setEditingDay(ep.day)} onTitleSave={(t) => saveEpisodeTitle(ep.day, t)} />

              ))}

            </div>

          </section>



          <section className="px-5 pt-8 pb-4">

            <div className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/10 to-bg-card p-5">

              <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">Heti finálé</p>

              <h2 className="text-lg font-bold mb-1">Heti finálé – narráció a vasárnapi videóhoz</h2>

              <p className="text-xs text-text-muted mb-4">

                Ez a szöveg a hét képeiből készülő TikTok/Reels videó alapja.

              </p>



              <button

                type="button"

                onClick={() => setRecapOpen(true)}

                className={`w-full text-left rounded-xl border-2 p-4 bg-bg/60 hover:border-accent/50 transition-colors ${

                  recapStatus === 'complete' ? 'border-green-500/50' : recapStatus === 'in_progress' ? 'border-yellow-500/50' : 'border-border'

                }`}

              >

                <div className="flex items-center gap-4">

                  <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">

                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">

                      <polygon points="5 3 19 12 5 21 5 3" />

                    </svg>

                  </div>

                  <div className="flex-1 min-w-0">

                    <p className="font-bold truncate">{series.weeklyRecap.title || series.title}</p>

                    <p className="text-xs text-text-muted truncate mt-0.5">

                      {series.weeklyRecap.text || 'Még nincs narráció szöveg'}

                    </p>

                    <div className="flex flex-wrap gap-2 mt-1.5">

                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">

                        Narráció: {EDIT_STATUS_LABELS[recapStatus]}

                      </span>

                      {series.weeklyRecap.video && (

                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">Videó feltöltve</span>

                      )}

                    </div>

                  </div>

                  <span className="text-text-muted">→</span>

                </div>

              </button>

            </div>

          </section>

        </div>

      )}



      {editingEpisode && id && (

        <EpisodeEditorModal seriesId={id} episode={editingEpisode} onClose={() => setEditingDay(null)} onSaved={setSeries} />

      )}

      {recapOpen && series && (

        <RecapEditorModal series={series} onClose={() => setRecapOpen(false)} onSaved={setSeries} />

      )}

    </div>

  );

}



function EpisodeCard({ episode, onOpen, onTitleSave }: { episode: Episode; onOpen: () => void; onTitleSave: (t: string) => void }) {

  const [localTitle, setLocalTitle] = useState(episode.title);

  const status = getEpisodeEditStatus(episode);

  const colors = { empty: 'border-border', in_progress: 'border-yellow-500/50', complete: 'border-green-500/50' };



  useEffect(() => setLocalTitle(episode.title), [episode.title]);



  return (

    <div className="flex-shrink-0 w-[200px] sm:w-[220px] snap-start">

      <button type="button" onClick={onOpen} className={`group w-full rounded-xl overflow-hidden border-2 ${colors[status]} bg-bg-card hover:border-accent/40 active:scale-[0.98] transition-all`}>

        <div className="relative aspect-[4/5] overflow-hidden">

          <EpisodeThumbnail episode={episode} containerClassName="absolute inset-0" />

          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />

          <span className="absolute top-2 left-2 text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded">{episode.day}. rész</span>

          <div className="absolute top-2 right-2">

            <StatusDot status={status} />

          </div>

          <div className="absolute bottom-0 inset-x-0 p-2.5">

            <p className="text-sm font-bold leading-tight line-clamp-2">{episode.title || `${episode.day}. rész`}</p>

            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-1">{EDIT_STATUS_LABELS[status]}</p>

          </div>

        </div>

      </button>

      <input

        className="input !text-xs !py-1.5 mt-1.5"

        value={localTitle}

        onChange={(e) => setLocalTitle(e.target.value)}

        onBlur={() => localTitle.trim() !== episode.title && onTitleSave(localTitle.trim())}

        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}

        placeholder={`${episode.day}. rész címe`}

      />

    </div>

  );

}



function StatusDot({ status }: { status: ReturnType<typeof getEpisodeEditStatus> }) {

  const colors = { empty: 'bg-text-muted', in_progress: 'bg-yellow-400', complete: 'bg-green-500' };

  return <span className={`block w-2.5 h-2.5 rounded-full ${colors[status]}`} />;

}



function Field({ label, children }: { label: string; children: React.ReactNode }) {

  return <div><label className="block text-sm font-medium mb-1.5">{label}</label>{children}</div>;

}



function Spinner() {

  return <div className="min-h-dvh flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

}

