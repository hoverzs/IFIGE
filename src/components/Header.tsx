import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="app-logo" aria-label="ifIge főoldal">
          <span className="app-logo__if">if</span>
          <span className="app-logo__i">I</span>
          <span className="app-logo__ge">ge</span>
        </Link>

        <Link to="/admin" className="site-header__admin">
          Admin
        </Link>
      </div>
    </header>
  );
}
