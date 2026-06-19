import { Link } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
}

export default function Button({
  children,
  to,
  onClick,
  variant = 'primary',
  className = '',
  disabled,
  type = 'button',
}: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover text-white px-6 py-3.5 text-sm shadow-lg shadow-accent/20',
    secondary: 'bg-bg-card border border-border hover:border-accent/50 text-text px-6 py-3.5 text-sm',
    ghost: 'text-text-muted hover:text-text px-4 py-2 text-sm',
  };

  const classes = `${base} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
