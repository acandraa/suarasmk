import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Clock, FileText, CheckCircle, HelpCircle } from 'lucide-react';

const TrackStatus = () => {
  const [reportNumber, setReportNumber] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNumber.trim()) return;

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('report_number', reportNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Laporan tidak ditemukan. Pastikan nomor laporan benar.');
        } else {
          throw error;
        }
      } else {
        setReport(data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Terjadi kesalahan saat mencari laporan.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, className: string, icon: any }> = {
      'Baru': { label: 'Baru', className: 'badge-baru', icon: <FileText size={16} /> },
      'Diperiksa': { label: 'Diperiksa', className: 'badge-diperiksa', icon: <Clock size={16} /> },
      'Ditindaklanjuti': { label: 'Sedang Ditindaklanjuti', className: 'badge-ditindaklanjuti', icon: <HelpCircle size={16} /> },
      'Selesai': { label: 'Selesai', className: 'badge-selesai', icon: <CheckCircle size={16} /> },
    };

    const s = statusMap[status] || { label: status, className: 'badge-baru', icon: null };

    return (
      <span className={`badge ${s.className}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem', display: 'inline-flex', gap: '0.5rem' }}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card mb-6">
        <h2 className="text-center mb-4">Cek Status Pengaduan</h2>
        <p className="text-center mb-6">Masukkan nomor laporan Anda (misal: LAP-20260923-123) untuk melihat perkembangannya.</p>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Nomor Laporan..." 
            value={reportNumber}
            onChange={(e) => setReportNumber(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Search size={18} /> Cari
          </button>
        </form>

        {error && (
          <div className="mt-4" style={{ color: 'var(--danger-color)', textAlign: 'center', fontWeight: 500 }}>
            {error}
          </div>
        )}
      </div>

      {report && (
        <div className="card">
          <h3 className="mb-4 text-center">Hasil Pencarian</h3>
          
          <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Nomor Laporan</p>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1.25rem', color: 'var(--primary-color)' }}>{report.report_number}</h4>
            
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Kategori</p>
            <p style={{ margin: '0 0 1rem', fontWeight: 500 }}>{report.category}</p>
            
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tanggal Dibuat</p>
            <p style={{ margin: 0, fontWeight: 500 }}>
              {new Date(report.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="text-center mt-6">
            <p className="mb-2" style={{ fontWeight: 600 }}>Status Saat Ini:</p>
            {getStatusBadge(report.status)}
            
            <p className="mt-4" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Terakhir diperbarui: {new Date(report.updated_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackStatus;
