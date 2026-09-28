import { useState } from 'react';
import { X, FileText, File, Printer, Calendar, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'pengaduan' | 'kekerasan';
  reports?: any[];
  violenceRecords?: any[];
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const PrintReportModal = ({ isOpen, onClose, type, reports = [], violenceRecords = [] }: PrintReportModalProps) => {
  const currentDate = new Date();
  const [filterType, setFilterType] = useState<'all' | 'month' | 'year' | 'range'>('month');
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - i);

  const getFilteredData = () => {
    const source = type === 'pengaduan' ? reports : violenceRecords;
    if (filterType === 'all') return source;

    return source.filter((item) => {
      const itemDate = new Date(item.created_at);
      if (filterType === 'month') {
        return (
          itemDate.getMonth() + 1 === selectedMonth &&
          itemDate.getFullYear() === selectedYear
        );
      } else if (filterType === 'year') {
        return itemDate.getFullYear() === selectedYear;
      } else if (filterType === 'range' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        return itemDate >= start && itemDate <= end;
      }
      return true;
    });
  };

  const getPeriodLabel = () => {
    if (filterType === 'all') return 'Semua Periode';
    if (filterType === 'month') return `${MONTHS_ID[selectedMonth - 1]} ${selectedYear}`;
    if (filterType === 'year') return `Tahun ${selectedYear}`;
    if (filterType === 'range' && startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('id-ID');
      const end = new Date(endDate).toLocaleDateString('id-ID');
      return `${start} - ${end}`;
    }
    return '-';
  };

  const getReportTitle = () => {
    if (type === 'pengaduan') return 'LAPORAN PENGADUAN SISWA';
    return 'BUKU CATATAN KASUS KEKERASAN';
  };

  const exportToPDF = async () => {
    setIsGenerating(true);
    try {
      const data = getFilteredData();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      // Header background
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, 297, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(getReportTitle(), 148.5, 13, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode: ${getPeriodLabel()}`, 148.5, 22, { align: 'center' });

      doc.setFontSize(9);
      doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}  |  Total Data: ${data.length}`, 148.5, 30, { align: 'center' });

      doc.setTextColor(0, 0, 0);

      if (type === 'pengaduan') {
        const tableData = data.map((r: any, idx: number) => [
          idx + 1,
          r.report_number || '-',
          r.category || '-',
          r.is_anonymous ? 'Anonim' : (r.reporter_name || '-'),
          r.reporter_class || '-',
          r.status || '-',
          new Date(r.created_at).toLocaleDateString('id-ID'),
        ]);

        autoTable(doc, {
          startY: 40,
          head: [['No', 'Nomor Laporan', 'Kategori', 'Pelapor', 'Kelas', 'Status', 'Tanggal']],
          body: tableData,
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [240, 245, 255] },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 40 },
            2: { cellWidth: 35 },
            3: { cellWidth: 40 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 },
            6: { cellWidth: 30 },
          },
        });
      } else {
        const tableData = data.map((r: any, idx: number) => [
          idx + 1,
          r.perpetrator_name || '-',
          r.perpetrator_class || '-',
          r.case_description || '-',
          r.action_taken || 'Belum ada tindak lanjut',
          r.user_profiles?.name || 'Staf',
          new Date(r.created_at).toLocaleDateString('id-ID'),
        ]);

        autoTable(doc, {
          startY: 40,
          head: [['No', 'Nama Pelaku', 'Kelas', 'Deskripsi Kasus', 'Tindak Lanjut', 'Dicatat Oleh', 'Tanggal']],
          body: tableData,
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [255, 240, 240] },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 70 },
            4: { cellWidth: 60 },
            5: { cellWidth: 35 },
            6: { cellWidth: 30 },
          },
        });
      }

      // Footer on each page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Halaman ${i} dari ${pageCount}  |  SuaraSMK - Sistem Pengaduan Siswa`,
          148.5,
          205,
          { align: 'center' }
        );
      }

      const fileName = type === 'pengaduan'
        ? `Laporan_Pengaduan_${getPeriodLabel().replace(/\s/g, '_')}.pdf`
        : `Buku_Catatan_Kekerasan_${getPeriodLabel().replace(/\s/g, '_')}.pdf`;

      doc.save(fileName);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToWord = async () => {
    setIsGenerating(true);
    try {
      const data = getFilteredData();
      const headerColor = type === 'pengaduan' ? '1E40AF' : 'B91C1C';
      const rowShadeColor = type === 'pengaduan' ? 'EEF2FF' : 'FFF0F0';

      const columnHeaders = type === 'pengaduan'
        ? ['No', 'Nomor Laporan', 'Kategori', 'Pelapor', 'Kelas', 'Status', 'Tanggal']
        : ['No', 'Nama Pelaku', 'Kelas', 'Deskripsi Kasus', 'Tindak Lanjut', 'Dicatat Oleh', 'Tanggal'];

      const headerRow = new TableRow({
        tableHeader: true,
        children: columnHeaders.map((header) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: headerColor },
            children: [
              new Paragraph({
                children: [new TextRun({ text: header, bold: true, color: 'FFFFFF', size: 18 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          })
        ),
      });

      const dataRows = data.map((r: any, idx: number) => {
        const cells = type === 'pengaduan'
          ? [
              String(idx + 1),
              r.report_number || '-',
              r.category || '-',
              r.is_anonymous ? 'Anonim' : (r.reporter_name || '-'),
              r.reporter_class || '-',
              r.status || '-',
              new Date(r.created_at).toLocaleDateString('id-ID'),
            ]
          : [
              String(idx + 1),
              r.perpetrator_name || '-',
              r.perpetrator_class || '-',
              r.case_description || '-',
              r.action_taken || 'Belum ada tindak lanjut',
              r.user_profiles?.name || 'Staf',
              new Date(r.created_at).toLocaleDateString('id-ID'),
            ];

        return new TableRow({
          children: cells.map((cell) =>
            new TableCell({
              shading: idx % 2 !== 0
                ? { type: ShadingType.SOLID, color: rowShadeColor }
                : undefined,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cell, size: 16 })],
                }),
              ],
            })
          ),
        });
      });

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          insideH: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          insideV: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
        rows: [headerRow, ...dataRows],
      });

      const wordDoc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: getReportTitle(),
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Periode: ', bold: true, size: 22 }),
                  new TextRun({ text: getPeriodLabel(), size: 22 }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Total Data: ', bold: true, size: 20 }),
                  new TextRun({ text: String(data.length), size: 20 }),
                  new TextRun({ text: '  |  Dicetak: ', bold: true, size: 20 }),
                  new TextRun({ text: new Date().toLocaleString('id-ID'), size: 20 }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 },
              }),
              table,
              new Paragraph({
                children: [
                  new TextRun({ text: 'SuaraSMK - Sistem Pengaduan Siswa', italics: true, size: 16, color: '888888' }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBlob(wordDoc);
      const fileName = type === 'pengaduan'
        ? `Laporan_Pengaduan_${getPeriodLabel().replace(/\s/g, '_')}.docx`
        : `Buku_Catatan_Kekerasan_${getPeriodLabel().replace(/\s/g, '_')}.docx`;

      saveAs(buffer, fileName);
    } finally {
      setIsGenerating(false);
    }
  };

  const printPreview = () => {
    const data = getFilteredData();
    const isViolence = type === 'kekerasan';
    const headerColor = isViolence ? '#B91C1C' : '#1E40AF';

    const tableRows = data.map((r: any, idx: number) => {
      if (!isViolence) {
        return `
          <tr style="background:${idx % 2 === 0 ? '#fff' : '#EEF2FF'}">
            <td>${idx + 1}</td>
            <td><strong>${r.report_number || '-'}</strong></td>
            <td>${r.category || '-'}</td>
            <td>${r.is_anonymous ? 'Anonim' : (r.reporter_name || '-')}</td>
            <td>${r.reporter_class || '-'}</td>
            <td>${r.status || '-'}</td>
            <td>${new Date(r.created_at).toLocaleDateString('id-ID')}</td>
          </tr>`;
      } else {
        return `
          <tr style="background:${idx % 2 === 0 ? '#fff' : '#FFF0F0'}">
            <td>${idx + 1}</td>
            <td><strong style="color:#B91C1C">${r.perpetrator_name || '-'}</strong></td>
            <td>${r.perpetrator_class || '-'}</td>
            <td>${r.case_description || '-'}</td>
            <td>${r.action_taken || 'Belum ada tindak lanjut'}</td>
            <td>${r.user_profiles?.name || 'Staf'}</td>
            <td>${new Date(r.created_at).toLocaleDateString('id-ID')}</td>
          </tr>`;
      }
    }).join('');

    const headers = isViolence
      ? ['No', 'Nama Pelaku', 'Kelas', 'Deskripsi Kasus', 'Tindak Lanjut', 'Dicatat Oleh', 'Tanggal']
      : ['No', 'Nomor Laporan', 'Kategori', 'Pelapor', 'Kelas', 'Status', 'Tanggal'];

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8"/>
        <title>${getReportTitle()}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; padding: 20mm; font-size: 11px; color: #1a1a2e; }
          .header { background: ${headerColor}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
          .header h1 { font-size: 18px; font-weight: 700; margin-bottom: 5px; }
          .header p { font-size: 12px; opacity: 0.9; }
          .meta { display: flex; gap: 20px; margin-bottom: 20px; }
          .meta-item { background: #f8fafc; border-radius: 8px; padding: 10px 16px; border-left: 4px solid ${headerColor}; }
          .meta-item label { font-size: 10px; color: #666; display: block; }
          .meta-item span { font-weight: 600; font-size: 13px; color: #1a1a2e; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: ${headerColor}; color: white; padding: 8px 10px; text-align: left; font-size: 10px; }
          td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; vertical-align: top; }
          .footer { text-align: center; color: #999; font-size: 9px; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; }
          @media print { body { padding: 10mm; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${getReportTitle()}</h1>
          <p>Periode: ${getPeriodLabel()} &nbsp;|&nbsp; Dicetak: ${new Date().toLocaleString('id-ID')}</p>
        </div>
        <div class="meta">
          <div class="meta-item"><label>Total Data</label><span>${data.length} data</span></div>
          <div class="meta-item"><label>Periode</label><span>${getPeriodLabel()}</span></div>
          <div class="meta-item"><label>Jenis Laporan</label><span>${type === 'pengaduan' ? 'Laporan Pengaduan Siswa' : 'Buku Catatan Kekerasan'}</span></div>
        </div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableRows || `<tr><td colspan="7" style="text-align:center;padding:20px;color:#999">Tidak ada data untuk periode ini</td></tr>`}
          </tbody>
        </table>
        <div class="footer">SuaraSMK - Sistem Pengaduan Siswa &nbsp;|&nbsp; Laporan ini dicetak secara otomatis</div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (!isOpen) return null;

  const filteredCount = getFilteredData().length;
  const accentColor = type === 'pengaduan' ? '#1E40AF' : '#B91C1C';
  const lightBg = type === 'pengaduan' ? '#EEF2FF' : '#FFF0F0';
  const borderAccent = type === 'pengaduan' ? '#C7D2FE' : '#FECACA';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '580px', width: '100%',
          background: 'var(--card-bg, white)',
          borderRadius: 'var(--radius-md, 12px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${type === 'pengaduan' ? '#3B82F6' : '#EF4444'})`,
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Printer size={22} color="white" />
            <div>
              <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                Cetak {type === 'pengaduan' ? 'Laporan Pengaduan' : 'Buku Catatan Kekerasan'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.8rem' }}>
                Pilih periode dan format ekspor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px', height: '32px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="white" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Filter Type Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem',
              color: 'var(--text-main)',
            }}>
              <Filter size={14} />
              Filter Periode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                { value: 'month', label: 'Per Bulan' },
                { value: 'year', label: 'Per Tahun' },
                { value: 'range', label: 'Rentang' },
                { value: 'all', label: 'Semua' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterType(value as any)}
                  style={{
                    padding: '0.5rem 0.25rem',
                    borderRadius: '8px',
                    border: `2px solid ${filterType === value ? accentColor : 'var(--border-color, #e5e7eb)'}`,
                    background: filterType === value ? lightBg : 'transparent',
                    color: filterType === value ? accentColor : 'var(--text-muted, #6b7280)',
                    fontSize: '0.75rem',
                    fontWeight: filterType === value ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Inputs */}
          <div style={{
            background: 'var(--bg-color, #f8fafc)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-color, #e5e7eb)',
          }}>
            {filterType === 'month' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={13} /> Bulan
                  </label>
                  <select className="form-control" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                    {MONTHS_ID.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Tahun</label>
                  <select className="form-control" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            )}

            {filterType === 'year' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={13} /> Tahun
                </label>
                <select className="form-control" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}

            {filterType === 'range' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Dari Tanggal</label>
                  <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sampai Tanggal</label>
                  <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            )}

            {filterType === 'all' && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', margin: 0, padding: '0.5rem 0' }}>
                Semua data akan diekspor tanpa filter periode.
              </p>
            )}
          </div>

          {/* Data Count Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: filteredCount > 0 ? lightBg : '#FFF3CD',
              border: `1px solid ${filteredCount > 0 ? borderAccent : '#FBBF24'}`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Data ditemukan untuk <strong>{getPeriodLabel()}</strong>:
            </span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: filteredCount > 0 ? accentColor : '#D97706',
            }}>
              {filteredCount} data
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <button
              onClick={printPreview}
              disabled={isGenerating || filteredCount === 0}
              style={{
                padding: '0.75rem 0.5rem',
                background: 'transparent',
                color: 'var(--text-main)',
                border: '2px solid var(--border-color, #e5e7eb)',
                borderRadius: '8px',
                cursor: filteredCount === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.8rem', fontWeight: 600,
                opacity: filteredCount === 0 ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              <Printer size={20} />
              Cetak / Print
            </button>

            <button
              onClick={exportToPDF}
              disabled={isGenerating || filteredCount === 0}
              style={{
                padding: '0.75rem 0.5rem',
                background: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: filteredCount === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.8rem', fontWeight: 600,
                opacity: filteredCount === 0 ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              <FileText size={20} />
              {isGenerating ? 'Memproses...' : 'Unduh PDF'}
            </button>

            <button
              onClick={exportToWord}
              disabled={isGenerating || filteredCount === 0}
              style={{
                padding: '0.75rem 0.5rem',
                background: '#1E40AF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: filteredCount === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.8rem', fontWeight: 600,
                opacity: filteredCount === 0 ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              <File size={20} />
              {isGenerating ? 'Memproses...' : 'Unduh Word'}
            </button>
          </div>

          {filteredCount === 0 && (
            <p style={{ textAlign: 'center', color: '#D97706', fontSize: '0.8rem', marginTop: '0.75rem' }}>
              ⚠️ Tidak ada data pada periode yang dipilih. Ubah filter untuk mendapatkan hasil.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintReportModal;
