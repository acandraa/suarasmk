import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut, Eye } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, diproses: 0, selesai: 0 });
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Fitur Buku Catatan Kekerasan
  const [activeTab, setActiveTab] = useState('pengaduan');
  const [violenceRecords, setViolenceRecords] = useState<any[]>([]);
  const [showViolenceForm, setShowViolenceForm] = useState(false);
  const [newViolence, setNewViolence] = useState({
    perpetrator_name: '',
    perpetrator_class: '',
    case_description: '',
    action_taken: ''
  });

  useEffect(() => {
    checkUser();
    fetchReports();
    fetchViolenceRecords();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserProfile(profile);
      if (profile.role === 'admin') {
        navigate('/admin/dashboard');
      }
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
    navigate('/login');
  };

  const fetchNotes = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from('report_notes')
        .select('*, user_profiles(name, role)')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchViolenceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('violence_records')
        .select('*, user_profiles(name, role)')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setViolenceRecords(data || []);
    } catch (error) {
      console.error('Error fetching violence records:', error);
    }
  };

  const addViolenceRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const { error } = await supabase
        .from('violence_records')
        .insert({
          perpetrator_name: newViolence.perpetrator_name,
          perpetrator_class: newViolence.perpetrator_class,
          case_description: newViolence.case_description,
          action_taken: newViolence.action_taken,
          recorded_by: userProfile.id
        });

      if (error) throw error;
      
      setNewViolence({ perpetrator_name: '', perpetrator_class: '', case_description: '', action_taken: '' });
      setShowViolenceForm(false);
      fetchViolenceRecords();
      alert('Data pelaku berhasil dicatat!');
    } catch (error) {
      console.error('Error adding violence record:', error);
      alert('Gagal mencatat data pelaku.');
    }
  };

  const addNote = async (e: React.FormEvent, isViolenceFlag = false) => {
    e.preventDefault();
    if (!newNote.trim() && !isViolenceFlag) return;
    if (!userProfile || !selectedReport) return;
    
    const noteContent = isViolenceFlag ? "⚠️ TANDAI SEBAGAI DUGAAN KASUS KEKERASAN ⚠️\n" + newNote : newNote;

    try {
      const { error } = await supabase
        .from('report_notes')
        .insert({
          report_id: selectedReport.id,
          user_id: userProfile.id,
          note: noteContent
        });

      if (error) throw error;
      setNewNote('');
      fetchNotes(selectedReport.id);
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Gagal menambahkan catatan');
    }
  };

  const handleSelectReport = (report: any) => {
    setSelectedReport(report);
    fetchNotes(report.id);
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

      <div className="flex gap-4 mb-6">
        <button 
          className={`btn ${activeTab === 'pengaduan' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('pengaduan')}
        >
          Daftar Pengaduan Siswa
        </button>
        <button 
          className={`btn ${activeTab === 'kekerasan' ? 'btn-primary' : 'btn-outline'}`}
          style={activeTab === 'kekerasan' ? { background: 'var(--danger-color)', borderColor: 'var(--danger-color)' } : { color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
          onClick={() => setActiveTab('kekerasan')}
        >
          Buku Catatan Kasus Kekerasan
        </button>
      </div>

      {activeTab === 'pengaduan' && (
        <>
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
                          onClick={() => handleSelectReport(report)}
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

            <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
              <h4 className="mb-4">Buku Catatan Laporan & Tindak Lanjut</h4>
              
              <div className="mb-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notes.length === 0 ? (
                  <p className="text-center" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Belum ada catatan.</p>
                ) : (
                  notes.map(note => (
                    <div key={note.id} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                      <div className="flex justify-between items-center mb-2">
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{note.user_profiles?.name || 'Staf'} ({note.user_profiles?.role})</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(note.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{note.note}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={(e) => addNote(e)} className="mt-4">
                <div className="form-group mb-2">
                  <textarea 
                    className="form-control" 
                    placeholder="Tambahkan catatan perkembangan kasus, hasil konseling, dll..."
                    rows={3}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  ></textarea>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={!newNote.trim()}>
                    Simpan Catatan
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}
                    onClick={(e) => addNote(e, true)}
                  >
                    Tandai Dugaan Kekerasan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
        </>
      )}

      {activeTab === 'kekerasan' && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h3>Buku Catatan Kasus Kekerasan (Pendataan Pelaku)</h3>
            <button 
              className="btn btn-primary" 
              style={{ background: 'var(--danger-color)' }}
              onClick={() => setShowViolenceForm(!showViolenceForm)}
            >
              {showViolenceForm ? 'Batal' : '+ Tambah Data Pelaku'}
            </button>
          </div>

          {showViolenceForm && (
            <div className="mb-6 p-4" style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <h4 className="mb-4">Form Pendataan Pelaku Kekerasan</h4>
              <form onSubmit={addViolenceRecord}>
                <div className="dashboard-grid mb-4">
                  <div className="form-group">
                    <label className="form-label">Nama Pelaku</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={newViolence.perpetrator_name}
                      onChange={e => setNewViolence({...newViolence, perpetrator_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kelas</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newViolence.perpetrator_class}
                      onChange={e => setNewViolence({...newViolence, perpetrator_class: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Deskripsi Kasus / Pelanggaran</label>
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    required
                    value={newViolence.case_description}
                    onChange={e => setNewViolence({...newViolence, case_description: e.target.value})}
                  ></textarea>
                </div>
                <div className="form-group mb-4">
                  <label className="form-label">Tindak Lanjut / Sanksi</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    value={newViolence.action_taken}
                    onChange={e => setNewViolence({...newViolence, action_taken: e.target.value})}
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger-color)' }}>Simpan Data Pelaku</button>
              </form>
            </div>
          )}

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Pelaku</th>
                  <th>Kelas</th>
                  <th>Deskripsi Kasus</th>
                  <th>Tindak Lanjut</th>
                  <th>Dicatat Oleh</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {violenceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">Belum ada data pelaku kekerasan yang dicatat.</td>
                  </tr>
                ) : (
                  violenceRecords.map(record => (
                    <tr key={record.id}>
                      <td style={{ fontWeight: 600, color: 'var(--danger-color)' }}>{record.perpetrator_name}</td>
                      <td>{record.perpetrator_class || '-'}</td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{record.case_description}</td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'normal' }}>{record.action_taken || 'Belum ada tindak lanjut'}</td>
                      <td>{record.user_profiles?.name || 'Staf'}</td>
                      <td>{new Date(record.created_at).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
