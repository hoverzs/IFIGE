import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createSeries } from '../../api';
import MediaUpload from '../../components/MediaUpload';
import Button from '../../components/Button';

export default function NewSeriesPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [biblicalBasis, setBiblicalBasis] = useState('');
  const [weeklyMessage, setWeeklyMessage] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [releaseMode, setReleaseMode] = useState<'all' | 'daily'>('daily');
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft');
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('A cím kötelező'); return; }
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      fd.append('biblicalBasis', biblicalBasis);
      fd.append('weeklyMessage', weeklyMessage);
      fd.append('startDate', startDate);
      fd.append('releaseMode', releaseMode);
      fd.append('status', status);
      if (cover) fd.append('coverImage', cover);
      const series = await createSeries(fd);
      navigate(`/admin/series/${series.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-50 flex items-center gap-3 px-5 py-4 bg-bg/95 backdrop-blur border-b border-border">
        <Link to="/admin" className="text-text-muted hover:text-text">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </Link>
        <h1 className="text-lg font-bold">Új heti sorozat</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-5 py-6 max-w-2xl mx-auto space-y-5">
        <Field label="Sorozat címe" required>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pl. Amikor megtagadsz" />
        </Field>
        <Field label="Bibliai alap">
          <input className="input" value={biblicalBasis} onChange={(e) => setBiblicalBasis(e.target.value)} />
        </Field>
        <Field label="Heti üzenet">
          <textarea className="input resize-none" rows={2} value={weeklyMessage} onChange={(e) => setWeeklyMessage(e.target.value)} />
        </Field>
        <Field label="Rövid leírás">
          <textarea className="input resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Kezdődátum">
          <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Megjelenés">
          <select className="input" value={releaseMode} onChange={(e) => setReleaseMode(e.target.value as typeof releaseMode)}>
            <option value="daily">Naponta egy rész (a kezdődátumtól)</option>
            <option value="all">Mind azonnal elérhető</option>
          </select>
        </Field>
        <Field label="Státusz">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="draft">Vázlat</option>
            <option value="active">Aktív</option>
          </select>
        </Field>
        <MediaUpload label="Borítókép (opcionális)" currentUrl="" previewUrl={coverPreview}
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aspectClass="aspect-video"
          onSelect={(f) => { setCover(f); setCoverPreview(URL.createObjectURL(f)); }}
          onRemove={() => { setCover(null); setCoverPreview(''); }}
          hint="Ha üres, az 1. epizód képe lesz a főoldalon"
        />
        {error && <p className="text-accent text-sm">{error}</p>}
        <Button type="submit" disabled={saving} className="w-full">{saving ? 'Létrehozás...' : 'Sorozat létrehozása'}</Button>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}{required && <span className="text-accent ml-1">*</span>}</label>
      {children}
    </div>
  );
}
