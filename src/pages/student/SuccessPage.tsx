import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle, MessageCircle, Copy } from 'lucide-react';

const SuccessPage = () => {
  const { reportNumber } = useParams();
  const location = useLocation();
  const state = location.state as { category: string, description: string, isAnonymous: boolean } | null;

  // Replace this with the actual BK WhatsApp Number (with country code)
  const bkWhatsAppNumber = '6281234567890'; 
  
  const generateWaLink = () => {
    let text = `🔔 *PENGADUAN BARU*\n\n`;
    text += `Nomor: ${reportNumber}\n`;
    text += `Kategori: ${state?.category || '-'}\n`;
    text += `Pelapor: ${state?.isAnonymous ? 'Anonim' : 'Siswa'}\n\n`;
    text += `*Isi:*\n${state?.description || '-'}\n\n`;
    text += `Silakan buka dashboard BK untuk melihat detail pengaduan.`;
    
    return `https://wa.me/${bkWhatsAppNumber}?text=${encodeURIComponent(text)}`;
  };

  const copyToClipboard = () => {
    if (reportNumber) {
      navigator.clipboard.writeText(reportNumber);
      alert('Nomor laporan disalin!');
    }
  };

  return (
    <div className="card text-center" style={{ maxWidth: '500px', margin: '0 auto', marginTop: '2rem' }}>
      <CheckCircle size={64} className="text-success mx-auto mb-4" style={{ margin: '0 auto', display: 'block', color: 'var(--success-color)' }} />
      <h2 style={{ color: 'var(--success-color)' }}>Laporan Berhasil Dikirim!</h2>
      
      <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', margin: '1.5rem 0' }}>
        <p style={{ margin: 0 }}>Nomor Laporan Anda:</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <h3 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '2px', color: 'var(--primary-color)' }}>
            {reportNumber}
          </h3>
          <button onClick={copyToClipboard} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', border: 'none' }}>
            <Copy size={16} />
          </button>
        </div>
        <p style={{ margin: '1rem 0 0', fontSize: '0.875rem' }}>
          Simpan nomor ini untuk mengecek status laporan Anda nanti.
        </p>
      </div>

      <div className="mb-6">
        <p style={{ fontSize: '0.875rem' }}>
          Bantu kami memproses laporan ini lebih cepat dengan mengirimkan notifikasi langsung ke WhatsApp BK.
        </p>
        <a 
          href={generateWaLink()} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-block mt-2"
          style={{ backgroundColor: '#25D366', color: 'white' }}
        >
          <MessageCircle size={18} /> Kirim Notifikasi via WhatsApp
        </a>
      </div>

      <Link to="/track" className="btn btn-outline btn-block">
        Cek Status Laporan
      </Link>
    </div>
  );
};

export default SuccessPage;
