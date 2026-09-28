import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <ShieldAlert size={24} className="text-primary" />
          <span>LaporSekolah</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="btn btn-outline" style={{ border: 'none', padding: '0.5rem 0.75rem' }}>Buat Laporan</Link>
          <Link to="/track" className="btn btn-outline" style={{ padding: '0.5rem 0.75rem' }}>Cek Status</Link>
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem' }}>Masuk Staf</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
