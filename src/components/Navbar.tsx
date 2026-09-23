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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
