import { mediaUrl } from '../api';

export type LivingImageVariant =
  | 'cinematicDrift'
  | 'slowPush'
  | 'breathe'
  | 'static'
  /** @deprecated — cinematicDrift alias */
  | 'hero'
  /** @deprecated — cinematicDrift alias */
  | 'cinematic'
  /** @deprecated — breathe alias */
  | 'card'
  /** @deprecated — breathe alias */
  | 'subtle';

/** false = éles tempó (16–22s). true = 4s debug */
export const LIVE_IMAGE_DEBUG = false;

export interface LiveImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  variant?: LivingImageVariant;
  seed?: number;
  debug?: boolean;
  /** Finom radial fény — alapból hero és epizódoldalon bekapcsolva */
  atmosphere?: boolean;
}

type MotionVariant = 'cinematicDrift' | 'slowPush' | 'breathe' | 'static';

function resolveImageSrc(src: string): string {
  if (src.startsWith('blob:') || src.startsWith('http') || src.startsWith('data:')) {
    return src;
  }
  return mediaUrl(src);
}

function normalizeVariant(variant: LivingImageVariant): MotionVariant {
  if (variant === 'static') return 'static';
  if (variant === 'slowPush') return 'slowPush';
  if (variant === 'breathe' || variant === 'card' || variant === 'subtle') return 'breathe';
  return 'cinematicDrift';
}

function motionClass(motion: MotionVariant): string {
  switch (motion) {
    case 'cinematicDrift':
      return 'live-image__img--cinematic-drift';
    case 'slowPush':
      return 'live-image__img--slow-push';
    case 'breathe':
      return 'live-image__img--breathe';
    default:
      return '';
  }
}

function defaultAtmosphere(motion: MotionVariant, explicit?: boolean): boolean {
  if (explicit != null) return explicit;
  return motion === 'cinematicDrift' || motion === 'slowPush';
}

export default function LiveImage({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  variant = 'cinematicDrift',
  seed,
  debug = LIVE_IMAGE_DEBUG,
  atmosphere,
}: LiveImageProps) {
  if (!src) return null;

  const motion = normalizeVariant(variant);
  const animate = motion !== 'static';
  const delay = seed != null ? `${((seed % 7) * 2.8).toFixed(1)}s` : undefined;
  const showAtmosphere = animate && defaultAtmosphere(motion, atmosphere);
  const eager = motion === 'cinematicDrift';

  return (
    <div
      className={[
        'live-image',
        debug && animate ? 'live-image--debug' : '',
        containerClassName,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={resolveImageSrc(src)}
        alt={alt}
        className={[
          'live-image__img',
          animate ? motionClass(motion) : 'live-image__img--static',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={delay ? { animationDelay: `-${delay}` } : undefined}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
      {showAtmosphere && (
        <div
          className="live-image__atmosphere"
          aria-hidden
          style={delay ? { animationDelay: `-${delay}` } : undefined}
        />
      )}
    </div>
  );
}
