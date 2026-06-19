import { mediaUrl, placeholderCover } from '../api';
import LiveImage from './LiveImage';

interface Props {
  label: string;
  currentUrl: string;
  previewUrl?: string;
  accept: string;
  aspectClass?: string;
  mediaType?: 'image' | 'video';
  uploadLabel?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  hint?: string;
}

export default function MediaUpload({
  label,
  currentUrl,
  previewUrl,
  accept,
  aspectClass = 'aspect-video',
  mediaType = 'image',
  uploadLabel,
  onSelect,
  onRemove,
  hint,
}: Props) {
  const displayUrl = previewUrl || (currentUrl ? mediaUrl(currentUrl) : '');
  const hasMedia = !!displayUrl;
  const placeholder = uploadLabel || (mediaType === 'video' ? 'Videó feltöltése' : 'Kép feltöltése');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        {hasMedia && (
          <button type="button" onClick={onRemove} className="text-xs text-accent hover:text-accent-hover font-medium">
            Törlés
          </button>
        )}
      </div>

      <label className="block cursor-pointer group">
        <div className={`relative ${aspectClass} rounded-xl overflow-hidden bg-bg border-2 border-dashed border-border group-hover:border-accent/40 transition-colors`}>
          {hasMedia ? (
            mediaType === 'video' ? (
              <video src={displayUrl} className="absolute inset-0 w-full h-full object-cover" controls muted />
            ) : (
              <LiveImage
                src={displayUrl}
                variant="breathe"
                atmosphere={false}
                containerClassName="absolute inset-0 h-full w-full"
              />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-text-muted gap-2 p-4">
              {mediaType === 'video' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
              <span className="text-xs text-center">{placeholder}</span>
            </div>
          )}

          {hasMedia && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-xs font-medium bg-bg/90 px-3 py-1.5 rounded-full">Csere</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
            e.target.value = '';
          }}
        />
      </label>

      {hint && <p className="text-xs text-text-muted mt-1.5">{hint}</p>}
    </div>
  );
}
