import type { Episode, Series } from '../api';
import { buildEpisodeShareContent } from '../api';
import ShareEpisodeButton from './ShareEpisodeButton';

interface Props {
  series: Series;
  episode: Episode;
}

export default function ShareEpisodeSection({ series, episode }: Props) {
  const preview = buildEpisodeShareContent(series, episode);

  return (
    <section className="rounded-2xl border border-border bg-bg-card/60 p-5 sm:p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Megosztás</p>
      <h3 className="font-bold text-base sm:text-lg mb-1">{preview.title}</h3>
      {preview.summary ? (
        <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-4">{preview.summary}</p>
      ) : (
        <p className="text-sm text-text-muted mb-4">Link és cím megosztása</p>
      )}
      <ShareEpisodeButton
        series={series}
        episode={episode}
        variant="button"
        className="!mt-0 !w-full !max-w-none"
      />
    </section>
  );
}
