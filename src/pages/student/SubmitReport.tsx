import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Send, Upload } from 'lucide-react';

const CATEGORIES = [
  'Bullying',
  'Masalah Teman',
  'Masalah Belajar',
  'Pelanggaran Siswa',
  'Sarana/Prasarana',
  'Kekerasan',
  'Lainnya'
];

const SubmitReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: CATEGORIES[0],
    description: '',
    reporterName: '',
    reporterClass: '',
    isAnonymous: false,
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate tracking ID
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(100 + Math.random() * 900);
      const reportNumber = `LAP-${dateStr}-${randomNum}`;

      const { error } = await supabase.from('reports').insert({
        report_number: reportNumber,
        category: formData.category,
        description: formData.description,
        reporter_name: formData.isAnonymous ? 'Anonim' : formData.reporterName,
        reporter_class: formData.isAnonymous ? '' : formData.reporterClass,
        is_anonymous: formData.isAnonymous,
        phone: formData.phone,
        status: 'Baru'
      });

      if (error) throw error;

      navigate(`/success/${reportNumber}`, { state: { category: formData.category, description: formData.description, isAnonymous: formData.isAnonymous } });
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 className="text-center mb-6">Buat Pengaduan</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group checkbox-wrapper mb-6">
          <input 
            type="checkbox" 
            id="isAnonymous" 
            checked={formData.isAnonymous}
            onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
          />
          <label htmlFor="isAnonymous" style={{ margin: 0, fontWeight: 500 }}>
            Sembunyikan Identitas Saya (Anonim)
          </label>
        </div>

        {!formData.isAnonymous && (
          <div className="flex gap-4 mb-4">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nama Lengkap</label>
              <input 
                type="text" 
                className="form-control" 
                required={!formData.isAnonymous}
                value={formData.reporterName}
                onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Kelas</label>
              <input 
                type="text" 
                className="form-control" 
                required={!formData.isAnonymous}
                value={formData.reporterClass}
                onChange={(e) => setFormData({...formData, reporterClass: e.target.value})}
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Kategori Laporan</label>
          <select 
            className="form-control"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Deskripsi Kejadian</label>
          <textarea 
            className="form-control" 
            placeholder="Jelaskan secara detail apa yang terjadi..."
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={{ minHeight: '120px' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nomor WhatsApp (Opsional)</label>
          <input 
            type="tel" 
            className="form-control" 
            placeholder="08xxxxxxxx"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Jika ingin dihubungi lebih lanjut.</p>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Mengirim...' : (
            <>
              <Send size={18} /> Kirim Laporan
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SubmitReport;
