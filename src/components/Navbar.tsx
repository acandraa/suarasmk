import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, FileText, Search, LogIn } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* TOP NAVBAR - Desktop only */}
      <nav className="navbar navbar-desktop">
        <div className="container navbar-container">
          <Link to="/" className="navbar-brand">
            <ShieldAlert size={24} />
            <span>LaporSekolah</span>
          </Link>
          <div className="navbar-links">
            <Link to="/" className="btn btn-outline" style={{ border: 'none', padding: '0.5rem 0.75rem' }}>Buat Laporan</Link>
            <Link to="/track" className="btn btn-outline" style={{ padding: '0.5rem 0.75rem' }}>Cek Status</Link>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem' }}>Masuk Staf</Link>
          </div>
        </div>
      </nav>

      {/* TOP MINI BAR - Mobile only (logo only) */}
      <nav className="navbar navbar-mobile-top">
        <div className="container">
          <Link to="/" className="navbar-brand">
            <ShieldAlert size={20} />
            <span>LaporSekolah</span>
          </Link>
        </div>
      </nav>

      {/* BOTTOM NAV - Mobile only */}
      <nav className="bottom-nav">
        <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
          <FileText size={22} />
          <span>Laporan</span>
        </Link>
        <Link to="/track" className={`bottom-nav-item ${isActive('/track') ? 'active' : ''}`}>
          <Search size={22} />
          <span>Cek Status</span>
        </Link>
        <Link to="/login" className={`bottom-nav-item ${isActive('/login') ? 'active' : ''}`}>
          <LogIn size={22} />
          <span>Masuk Staf</span>
        </Link>
      </nav>
    </>
  );
};

export default Navbar;
