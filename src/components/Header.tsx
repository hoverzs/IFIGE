import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="ifIge főoldal">
          <img
            src="/ifige-wordmark.png"
            alt="ifIge"
            className="site-header__brand-img"
            width={320}
            height={64}
            decoding="async"
          />
        </Link>

        <Link to="/admin" className="site-header__admin">
          Admin
        </Link>
      </div>
    </header>
  );
}
