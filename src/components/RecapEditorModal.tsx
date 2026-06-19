import { useEffect, useState } from 'react';
import type { Series } from '../api';
import { getRecapEditStatus, updateRecap, EDIT_STATUS_LABELS } from '../api';
import MediaUpload from './MediaUpload';
import Button from './Button';

interface Props {
  series: Series;
  onClose: () => void;
  onSaved: (s: Series) => void;
}

export default function RecapEditorModal({ series, onClose, onSaved }: Props) {
  const recap = series.weeklyRecap ?? { title: series.title, text: '', video: '' };
  const [title, setTitle] = useState(recap.title || series.title);
  const [text, setText] = useState(recap.text);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [removeVideo, setRemoveVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const status = getRecapEditStatus({ title, text, video: removeVideo ? '' : recap.video });
  const currentVideo = removeVideo ? '' : recap.video;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('text', text);
      if (videoFile) formData.append('video', videoFile);
      if (removeVideo) formData.append('removeVideo', 'true');
      const updated = await updateRecap(series.id, formData);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mentési hiba');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92dvh] bg-bg-card rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-0.5">Heti finálé</p>
            <h2 className="font-bold">Heti finálé – narráció</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Ez a szöveg a hét képeiből készülő TikTok/Reels videó alapja.
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-muted">✕</button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Státusz:</span>
            <span className={`font-bold uppercase tracking-wider ${
              status === 'complete' ? 'text-green-400' : status === 'in_progress' ? 'text-yellow-400' : 'text-text-muted'
            }`}>
              {EDIT_STATUS_LABELS[status]}
            </span>
          </div>

          <Field label="Cím">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <Field label="Narráció szövege">
            <textarea
              className="input resize-none"
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="A hét összefoglaló narrációja — ezt mondja el a videóban…"
            />
            <CharCount value={text} />
          </Field>

          <MediaUpload
            label="Heti videó"
            currentUrl={currentVideo}
            previewUrl={videoPreview}
            accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
            mediaType="video"
            aspectClass="aspect-video"
            onSelect={(file) => { setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); setRemoveVideo(false); }}
            onRemove={() => { setVideoFile(null); setVideoPreview(''); setRemoveVideo(true); }}
            hint="MP4, WebM vagy MOV — a vasárnapi heti finálé videó"
          />

          {error && <p className="text-accent text-sm">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-border pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Mentés...' : 'Heti finálé mentése'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function CharCount({ value }: { value: string }) {
  return <p className="text-[10px] text-text-muted mt-1 text-right">{value.length} karakter</p>;
}
