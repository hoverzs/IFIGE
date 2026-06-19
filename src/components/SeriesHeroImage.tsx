import { heroImageUrl } from '../api';
import type { Series } from '../api';
import LiveImage from './LiveImage';

interface Props {
  series: Series;
  imageSrc?: string;
  className?: string;
}

/** Főoldal hero: epizód/sorozat kép — LiveImage */
export default function SeriesHeroImage({ series, imageSrc, className = '' }: Props) {
  const src = imageSrc || series.episodes[0]?.image || series.heroImage || series.coverImage;

  if (!src) {
    return (
      <img
        src={heroImageUrl(series)}
        alt={series.title}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <LiveImage
      src={src}
      alt={series.title}
      variant="cinematicDrift"
      seed={0}
      containerClassName={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
