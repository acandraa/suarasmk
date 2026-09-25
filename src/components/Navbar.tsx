import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <ShieldAlert size={28} className="text-primary" />
          <span>LaporSekolah</span>
        </Link>
        <div className="flex gap-4 items-center">
          <Link to="/" className="btn btn-outline" style={{ border: 'none' }}>Buat Laporan</Link>
          <Link to="/track" className="btn btn-outline">Cek Status</Link>
          {/* Tambahan Tombol Login */}
          <Link to="/bk/login" className="btn btn-outline" style={{ border: 'none', marginLeft: '1rem', color: 'var(--text-muted)' }}>Login BK</Link>
          <Link to="/admin/login" className="btn btn-outline" style={{ border: 'none', color: 'var(--danger-color)' }}>Login Admin</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
