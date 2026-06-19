import { useEffect, useState } from 'react';
import type { Episode } from '../api';
import { clearEpisode, mediaUrl, updateEpisode } from '../api';
import MediaUpload from './MediaUpload';
import EpisodeMedia from './EpisodeMedia';
import LiveImage from './LiveImage';
import Button from './Button';

interface Props {
  seriesId: string;
  episode: Episode;
  onClose: () => void;
  onSaved: (series: Awaited<ReturnType<typeof updateEpisode>>) => void;
}

type Mode = 'edit' | 'preview';

export default function EpisodeEditorModal({ seriesId, episode, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<Mode>('edit');
  const [title, setTitle] = useState(episode.title);
  const [scripture, setScripture] = useState(episode.scripture);
  const [thought, setThought] = useState(episode.thought);
  const [question, setQuestion] = useState(episode.question);
  const [prayer, setPrayer] = useState(episode.prayer);
  const [teaser, setTeaser] = useState(episode.teaser);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const previewEpisode: Episode = {
    ...episode,
    title,
    scripture,
    thought,
    question,
    prayer,
    teaser,
    image: removeImage ? '' : (imagePreview ? '' : episode.image),
  };

  useEffect(() => {
    setTitle(episode.title);
    setScripture(episode.scripture);
    setThought(episode.thought);
    setQuestion(episode.question);
    setPrayer(episode.prayer);
    setTeaser(episode.teaser);
    setImageFile(null);
    setImagePreview('');
    setRemoveImage(false);
    setError('');
    setMode('edit');
  }, [episode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('scripture', scripture);
      formData.append('thought', thought);
      formData.append('question', question);
      formData.append('prayer', prayer);
      formData.append('teaser', teaser);
      if (imageFile) formData.append('image', imageFile);
      if (removeImage) formData.append('removeImage', 'true');
      const updated = await updateEpisode(seriesId, episode.day, formData);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mentési hiba');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!confirm(`${episode.day}. epizód teljes tartalmának törlése?`)) return;
    setSaving(true);
    try {
      const updated = await clearEpisode(seriesId, episode.day);
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Törlési hiba');
    } finally {
      setSaving(false);
    }
  };

  const currentImage = removeImage ? '' : episode.image;
  const previewImageSrc = imagePreview || (currentImage ? mediaUrl(currentImage) : '');

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg max-h-[92dvh] bg-bg-card rounded-t-2xl sm:rounded-2xl border border-border overflow-hidden flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-bold">{episode.day}. epizód</h2>
            <p className="text-xs text-text-muted">A történet {episode.day}. fejezete</p>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle mode={mode} onChange={setMode} />
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-muted hover:text-text">✕</button>
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
            <Field label="Cím">
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Epizód címe" />
            </Field>
            <Field label="Ige">
              <input className="input" value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="pl. Lk 22:33" />
            </Field>
            <Field label="Gondolat">
              <textarea className="input resize-none" rows={3} value={thought} onChange={(e) => setThought(e.target.value)} />
              <CharCount value={thought} />
            </Field>
            <Field label="Kérdés">
              <textarea className="input resize-none" rows={2} value={question} onChange={(e) => setQuestion(e.target.value)} />
            </Field>
            <Field label="Ima">
              <textarea className="input resize-none" rows={2} value={prayer} onChange={(e) => setPrayer(e.target.value)} />
              <CharCount value={prayer} />
            </Field>
            <Field label="Holnap (teaser)">
              <textarea
                className="input resize-none"
                rows={2}
                value={teaser}
                onChange={(e) => setTeaser(e.target.value)}
                placeholder="Holnap: A következő epizód rövid felvezetése…"
              />
              <CharCount value={teaser} />
            </Field>

            <MediaUpload
              label="Kép (élő kép)"
              currentUrl={currentImage}
              previewUrl={imagePreview}
              accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
              aspectClass="aspect-[4/5]"
              onSelect={(file) => { setImageFile(file); setImagePreview(URL.createObjectURL(file)); setRemoveImage(false); }}
              onRemove={() => { setImageFile(null); setImagePreview(''); setRemoveImage(true); }}
              hint="JPG, PNG, WebP vagy GIF — finom mozgással jelenik meg az appban"
            />

            {error && <p className="text-accent text-sm">{error}</p>}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 bg-bg">
            <div className="relative w-full aspect-[4/5] max-h-[40dvh] bg-black overflow-hidden">
              {previewImageSrc ? (
                <LiveImage
                  src={previewImageSrc}
                  variant="slowPush"
                  seed={episode.day}
                  containerClassName="absolute inset-0 h-full w-full"
                />
              ) : (
                <EpisodeMedia
                  episode={previewEpisode}
                  variant="slowPush"
                  containerClassName="absolute inset-0"
                  className="h-full"
                />
              )}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
            </div>
            <article className="px-5 py-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-1">{episode.day}. epizód</p>
                <h3 className="text-xl font-bold">{title || 'Cím nélkül'}</h3>
              </div>
              {scripture && (
                <section>
                  <PreviewLabel>Ige</PreviewLabel>
                  <p className="text-lg font-medium text-accent">{scripture}</p>
                </section>
              )}
              {thought && (
                <section>
                  <PreviewLabel>Gondolat</PreviewLabel>
                  <p className="leading-relaxed whitespace-pre-wrap">{thought}</p>
                </section>
              )}
              {question && (
                <section className="bg-bg-card rounded-2xl p-4 border border-border">
                  <PreviewLabel>Kérdés</PreviewLabel>
                  <p className="leading-relaxed italic">{question}</p>
                </section>
              )}
              {prayer && (
                <section className="bg-accent/10 rounded-2xl p-4 border border-accent/20">
                  <PreviewLabel>Ima</PreviewLabel>
                  <p className="leading-relaxed whitespace-pre-wrap">{prayer}</p>
                </section>
              )}
              {teaser && (
                <section className="border-l-2 border-accent pl-4">
                  <PreviewLabel>Holnap</PreviewLabel>
                  <p className="text-text-muted italic leading-relaxed whitespace-pre-wrap">{teaser}</p>
                </section>
              )}
            </article>
          </div>
        )}

        <div className="px-5 py-4 border-t border-border space-y-2 flex-shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {mode === 'edit' && (
            <>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Mentés...' : 'Epizód mentése'}
              </Button>
              <Button onClick={handleClear} disabled={saving} variant="ghost" className="w-full text-accent">
                Epizód kiürítése
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex rounded-full border border-border overflow-hidden text-[11px] font-semibold">
      <button
        type="button"
        onClick={() => onChange('edit')}
        className={`px-3 py-1.5 ${mode === 'edit' ? 'bg-accent text-white' : 'text-text-muted'}`}
      >
        Szerkesztés
      </button>
      <button
        type="button"
        onClick={() => onChange('preview')}
        className={`px-3 py-1.5 ${mode === 'preview' ? 'bg-accent text-white' : 'text-text-muted'}`}
      >
        Előnézet
      </button>
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

function PreviewLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">{children}</h4>;
}

function CharCount({ value }: { value: string }) {
  return <p className="text-[10px] text-text-muted mt-1 text-right">{value.length} karakter</p>;
}
