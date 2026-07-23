import { useState, useEffect, useMemo } from 'react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import useLogistikStore from '../../store/Logistik/useLogistikStore';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';
import {
  Plus, Search, Calendar, User, Trash2, Building2,
  Clock, ClipboardList, X
} from 'lucide-react';

const makeEmptyForm = (namaUser) => ({
  id_aset: '',
  nama_staf: namaUser || 'Guest',
  tanggal: new Date().toISOString().split('T')[0],
  tanggal_rencana_kembali: '',
  keperluan: '',
});

const KATEGORI_OPTIONS = [
  'Peralatan & Mesin',
  'Gedung & Bangunan',
  'Kendaraan',
  'Elektronik & IT',
  'Furnitur',
  'Aset Tetap Lainnya'
];

export default function PinjamAsetGuest() {
  const { currentUser } = useLogistikStore();
  const { aset, logAktivitas, addAktivitas, deleteAktivitas } = useHartaBendaStore();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => makeEmptyForm(currentUser?.nama));
  const [loading, setLoading] = useState(false);

  // Update nama staf di form jika data currentUser baru termuat
  useEffect(() => {
    if (currentUser?.nama && form.nama_staf === 'Guest') {
      setForm(prev => ({ ...prev, nama_staf: currentUser.nama }));
    }
  }, [currentUser]);

  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(9); // 3x3 grid

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterKategori, filterStatus, filterStartDate, filterEndDate]);

  // Parse status helper
  const parseStatus = (keterangan) => {
    if (keterangan?.includes('[Status: Pending]')) return 'Pending';
    if (keterangan?.includes('[Status: Disetujui]')) return 'Disetujui';
    if (keterangan?.includes('[Status: Ditolak]')) return 'Ditolak';
    return 'Disetujui';
  };

  // Bersihkan tag status dan label 'Keperluan:' dari string keterangan
  const getCleanKeterangan = (keterangan) => {
    if (!keterangan) return '-';
    return keterangan
      .replace(/^\[Status:\s*[^\]]+\]\s*/, '')
      .replace(/^Keperluan:\s*/i, '') || '-';
  };

  // Hitung ketersediaan aset berdasarkan aktivitas terakhir
  const latestActivity = useMemo(() => {
    const map = {};
    const sorted = [...(logAktivitas || [])].sort((a, b) => a.id - b.id);
    sorted.forEach(act => {
      map[act.id_aset] = act.jenis_aktivitas;
    });
    return map;
  }, [logAktivitas]);

  const availableAset = useMemo(() => {
    return (aset || []).filter(a => {
      const isCondOk = a.status_kondisi !== 'Dihapuskan' && a.status_kondisi !== 'Rusak Berat';
      const notBorrowed = latestActivity[a.id] !== 'Dipinjam';
      return isCondOk && notBorrowed;
    });
  }, [aset, latestActivity]);

  const asetOptions = useMemo(() => {
    return availableAset.map(a => ({
      label: `${a.nama_aset} — ${a.kode || a.id} (${a.lokasi_ruangan || 'Tanpa Lokasi'})`,
      value: a.id,
    }));
  }, [availableAset]);

  const getAssetDetails = (idAset) => {
    return (aset || []).find(a => a.id === idAset) || {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id_aset) {
      alert('Pilih aset terlebih dahulu!');
      return;
    }
    if (!form.tanggal_rencana_kembali) {
      alert('Tanggal rencana kembali wajib diisi!');
      return;
    }
    if (form.tanggal_rencana_kembali < form.tanggal) {
      alert('Tanggal kembali tidak boleh kurang dari tanggal pinjam!');
      return;
    }

    setLoading(true);
    const payload = {
      id_aset: form.id_aset,
      jenis_aktivitas: 'Dipinjam',
      nama_staf: form.nama_staf || currentUser?.nama || 'Guest',
      tanggal: form.tanggal,
      tanggal_rencana_kembali: form.tanggal_rencana_kembali,
      keterangan: `[Status: Pending] Keperluan: ${form.keperluan || '-'}`,
    };

    const ok = await addAktivitas(payload);
    setLoading(false);
    if (ok) {
      setForm(makeEmptyForm(currentUser?.nama));
      setOpen(false);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Yakin ingin membatalkan pengajuan peminjaman ini?')) {
      await deleteAktivitas(id);
    }
  };

  // Filter & Search Logic
  const filteredLoans = useMemo(() => {
    return (logAktivitas || [])
      .filter(act => act.nama_staf === currentUser?.nama && act.jenis_aktivitas === 'Dipinjam')
      .filter(act => {
        const item = getAssetDetails(act.id_aset);
        const status = parseStatus(act.keterangan);
        const cleanKet = getCleanKeterangan(act.keterangan);

        const targetText = `${item.nama_aset || ''} ${item.kode || ''} ${act.id_aset || ''} ${cleanKet}`.toLowerCase();
        const matchText = targetText.includes(filterText.toLowerCase());

        const matchKategori = filterKategori ? item.kategori_aset === filterKategori : true;
        const matchStatus = filterStatus ? status === filterStatus : true;

        // Pembandingan tanggal aman dengan format YYYY-MM-DD
        const matchStart = filterStartDate ? act.tanggal >= filterStartDate : true;
        const matchEnd = filterEndDate ? act.tanggal <= filterEndDate : true;

        return matchText && matchKategori && matchStatus && matchStart && matchEnd;
      })
      .sort((a, b) => b.id - a.id);
  }, [logAktivitas, aset, filterText, filterKategori, filterStatus, filterStartDate, filterEndDate, currentUser]);

  const pagedLoans = useMemo(() => {
    return filteredLoans.slice((currentPage - 1) * perPage, currentPage * perPage);
  }, [filteredLoans, currentPage, perPage]);

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Peminjaman Aset</h1>
          <p className="text-xs text-slate-400 mt-1">{filteredLoans.length} pengajuan peminjaman</p>
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(!open)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
        >
          {open ? <X size={15} /> : <Plus size={15} />}
          <span className="ml-1">{open ? 'Tutup Form' : 'Kirim Pengajuan'}</span>
        </Button>
      </div>

      {/* Form Tambah Pengajuan */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/40 p-21">
          <p className="text-base font-bold text-slate-700 mb-13">
            📋&nbsp; Pengajuan Pinjam Aset Baru
          </p>
          <form onSubmit={handleSubmit} className="space-y-13">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <SearchableSelect
                label="Pilih Aset"
                required
                options={asetOptions}
                value={form.id_aset}
                onChange={e => setForm({ ...form, id_aset: e.target.value })}
                placeholder={asetOptions.length === 0 ? "Tidak ada aset tersedia saat ini" : "Pilih aset..."}
                disabled={asetOptions.length === 0}
              />
              <Input
                label="Nama Peminjam"
                type="text"
                required
                value={form.nama_staf}
                onChange={e => setForm({ ...form, nama_staf: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-13">
              <Input
                label="Tanggal Pinjam"
                type="date"
                required
                value={form.tanggal}
                onChange={e => setForm({ ...form, tanggal: e.target.value })}
              />
              <Input
                label="Tanggal Kembali"
                type="date"
                required
                value={form.tanggal_rencana_kembali}
                onChange={e => setForm({ ...form, tanggal_rencana_kembali: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-5 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Keperluan / Tujuan
              </label>
              <textarea
                required
                value={form.keperluan}
                onChange={e => setForm({ ...form, keperluan: e.target.value })}
                className="w-full px-13 py-13 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none h-28"
                placeholder="Tulis tujuan peminjaman aset..."
              />
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setForm(makeEmptyForm(currentUser?.nama)); setOpen(false); }}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || asetOptions.length === 0}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? 'Mengirim...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Baris Filter & Pencarian */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="relative">
          <Search size={14} className="absolute left-13 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi (nama aset, kode, keperluan)..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <select
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value)}
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
          >
            <option value="">Semua Kategori Aset</option>
            {KATEGORI_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
          </select>

          <div className="flex items-center gap-5">
            <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Dari</span>
            <input
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            />
          </div>

          <div className="flex items-center gap-5">
            <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Smp</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid Card List */}
      {filteredLoans.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <ClipboardList size={34} className="mx-auto mb-5 text-slate-300" />
          Tidak ada riwayat transaksi peminjaman aset.
        </div>
      ) : (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 lg:gap-21 w-full">
            {pagedLoans.map(loan => {
              const item = getAssetDetails(loan.id_aset);
              const status = parseStatus(loan.keterangan);
              const keperluan = getCleanKeterangan(loan.keterangan);

              return (
                <div
                  key={loan.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Gambar Aset */}
                  <div className="w-full h-40 rounded-t-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.nama_aset}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Building2 size={34} className="text-slate-300" />
                    )}
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-500 font-bold text-[9px] px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wider">
                      {item.kategori_aset || 'Umum'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4">
                    {/* Nama & Kode */}
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">
                        {item.nama_aset || 'Aset Tidak Dikenal'}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {item.kode || item.id || loan.id_aset}
                      </p>
                    </div>

                    {/* Info detail */}
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-sm text-slate-600 mb-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold text-slate-400">Keperluan</span>
                        <span className="text-xs text-slate-600 text-right max-w-[60%] line-clamp-2">{keperluan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold text-slate-400">Tgl Pinjam</span>
                        <span className="text-xs text-slate-600">{loan.tanggal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs font-semibold text-slate-400">Tgl Kembali</span>
                        <span className="text-xs text-slate-600">{loan.tanggal_rencana_kembali || '-'}</span>
                      </div>
                    </div>

                    {/* Badge Status */}
                    <div className="mb-2">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider inline-block ${status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          status === 'Disetujui' ? 'bg-green-50 text-green-600 border border-green-100' :
                            'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                        {status}
                      </span>
                    </div>

                    {/* Footer divider */}
                    <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User size={12} className="shrink-0" />
                        <span className="truncate font-semibold">{loan.nama_staf}</span>
                      </div>
                      {status === 'Pending' && (
                        <button
                          onClick={() => handleCancel(loan.id)}
                          className="flex items-center gap-1 text-[10px] font-black text-rose-500 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-all shrink-0 ml-2"
                          title="Batalkan Pengajuan"
                        >
                          <Trash2 size={10} />
                          BATALKAN
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <Pagination
            total={filteredLoans.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      )}
    </div>
  );
}