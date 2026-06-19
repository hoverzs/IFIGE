import { placeholderEpisode } from '../api';
import type { Episode } from '../api';
import LiveImage, { type LivingImageVariant } from './LiveImage';

interface Props {
  episode: Episode;
  className?: string;
  containerClassName?: string;
  variant?: LivingImageVariant;
}

/** Epizód nagy kép — automatikus LiveImage */
export default function EpisodeMedia({
  episode,
  className = '',
  containerClassName = '',
  variant = 'slowPush',
}: Props) {
  if (!episode.image) {
    return (
      <img
        src={placeholderEpisode(episode.day)}
        alt={episode.title}
        className={`h-full w-full bg-bg-card object-cover ${className}`}
      />
    );
  }

  return (
    <LiveImage
      src={episode.image}
      alt={episode.title}
      seed={episode.day}
      variant={variant}
      containerClassName={containerClassName}
      className={className}
    />
  );
}

/** Epizód bélyegkép — automatikus LiveImage */
export function EpisodeThumbnail({
  episode,
  className = '',
  containerClassName = '',
}: Props) {
  if (!episode.image) {
    return (
      <img
        src={placeholderEpisode(episode.day)}
        alt=""
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <LiveImage
      src={episode.image}
      alt=""
      seed={episode.day}
      variant="breathe"
      atmosphere={false}
      containerClassName={containerClassName}
      className={className}
    />
  );
}

/** Bármely epizód-kép path */
export function EpisodeImage({
  src,
  alt = '',
  day,
  variant = 'slowPush',
  className = '',
  containerClassName = '',
}: {
  src: string;
  alt?: string;
  day?: number;
  variant?: LivingImageVariant;
  className?: string;
  containerClassName?: string;
}) {
  if (!src) return null;

  return (
    <LiveImage
      src={src}
      alt={alt}
      seed={day}
      variant={variant}
      containerClassName={containerClassName}
      className={className}
    />
  );
}
