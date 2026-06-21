import { useId } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  className?: string;
}

/** SVG szöveg wordmark — éles, reszponzív, prémium streaming érzet. */
export default function IfIgeLogo({ className = '' }: Props) {
  const uid = useId().replace(/:/g, '');
  const glowId = `ifige-glow-${uid}`;
  const gradId = `ifige-grad-${uid}`;

  return (
    <Link to="/" className={`ifige-logo ${className}`.trim()} aria-label="ifIge főoldal">
      <svg
        className="ifige-logo__svg"
        viewBox="0 0 116 32"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
      >
        <title>ifIge</title>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff5560" />
            <stop offset="50%" stopColor="#e50914" />
            <stop offset="100%" stopColor="#c20812" />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-50%" width="160%" height="200%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0.88  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0"
              result="redGlow"
            />
            <feMerge>
              <feMergeNode in="redGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <text x="0" y="23" className="ifige-logo__text ifige-logo__text--soft">
          if
        </text>

        <g className="ifige-logo__i-wrap" filter={`url(#${glowId})`}>
          {/* piros pont — finom hangsúly az „Ige” I-jén */}
          <circle cx="38.5" cy="7.2" r="2" fill={`url(#${gradId})`} className="ifige-logo__i-dot" />
          <text x="33" y="26.5" fill={`url(#${gradId})`} className="ifige-logo__text ifige-logo__text--i">
            I
          </text>
        </g>

        <text x="46.5" y="23" className="ifige-logo__text ifige-logo__text--soft">
          ge
        </text>
      </svg>
    </Link>
  );
}
