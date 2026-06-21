import { Link } from 'react-router-dom';
import IfIgeLogo from './IfIgeLogo';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <IfIgeLogo />

        <Link to="/admin" className="site-header__admin">
          Admin
        </Link>
      </div>
    </header>
  );
}
