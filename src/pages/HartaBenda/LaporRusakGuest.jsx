import { useState, useEffect, useMemo, useCallback } from 'react';
import useHartaBendaStore from '../../store/HartaBenda/useHartaBendaStore';
import useLogistikStore from '../../store/Logistik/useLogistikStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Pagination from '../../components/ui/Pagination';
import {
  Plus, Search, Calendar, User, Building2,
  Clock, AlertTriangle, X, Loader2, Pencil, Trash2
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

const makeEmptyForm = (currentUser) => ({
  id_aset: '',
  nama_pelapor: currentUser?.nama || 'Guest',
  tingkat: 'Ringan',
  deskripsi: '',
});

const TINGKAT_OPTIONS = [
  { label: 'Ringan', value: 'Ringan' },
  { label: 'Sedang', value: 'Sedang' },
  { label: 'Berat',  value: 'Berat'  },
];

const KATEGORI_OPTIONS = [
  'Peralatan & Mesin',
  'Gedung & Bangunan',
  'Kendaraan',
  'Elektronik & IT',
  'Furnitur',
  'Aset Tetap Lainnya'
];

// Badge helpers
const statusBadge = (status) => {
  switch (status) {
    case 'menunggu':     return 'bg-amber-50 text-amber-600 border border-amber-100';
    case 'diverifikasi': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'ditolak':      return 'bg-red-50 text-red-600 border border-red-100';
    default:             return 'bg-slate-100 text-slate-500 border border-slate-200';
  }
};

const statusLabel = (status) => {
  switch (status) {
    case 'menunggu':     return 'Menunggu Pengecekan';
    case 'diverifikasi': return 'Diverifikasi';
    case 'ditolak':      return 'Ditolak';
    default:             return status || '—';
  }
};

const tingkatColor = (tingkat) => {
  if (tingkat === 'Berat')  return 'text-red-600';
  if (tingkat === 'Sedang') return 'text-amber-600';
  return 'text-slate-600';
};

export default function LaporRusakGuest() {
  const { currentUser } = useLogistikStore();
  const { aset } = useHartaBendaStore();
  const toast = useToast();

  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(() => makeEmptyForm(currentUser));
  const [loading, setLoading] = useState(false);

  // Data laporan dari tabel laporan_kerusakan
  const [daftarLaporan, setDaftarLaporan] = useState([]);
  const [loadingList, setLoadingList]     = useState(true);

  // Form & Cancel States
  const [editId, setEditId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Filter States
  const [filterText, setFilterText]           = useState('');
  const [filterKategori, setFilterKategori]   = useState('');
  const [filterStatus, setFilterStatus]       = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate]     = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(9);

  // Update nama pelapor jika currentUser selesai dimuat (atau masih 'Guest')
  useEffect(() => {
    if (currentUser?.nama && (form.nama_pelapor === 'Guest' || !form.nama_pelapor)) {
      setForm(prev => ({ ...prev, nama_pelapor: currentUser.nama }));
    }
  }, [currentUser, form.nama_pelapor]);

  // Reset page ke 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, filterKategori, filterStatus, filterStartDate, filterEndDate]);

  // ── Fetch laporan ─────────────────────────────────────────
  const fetchDaftarLaporan = useCallback(async () => {
    try {
      setLoadingList(true);
      let query = supabase
        .from('laporan_kerusakan')
        .select(`
          *,
          aset:id_aset ( id, nama_aset, kode_aset, foto_url, lokasi_ruangan )
        `)
        .order('created_at', { ascending: false });

      // Filter by Name for Guest (karena id_user belum ada di tabel)
      if (currentUser?.nama) {
        query = query.eq('nama_pelapor', currentUser.nama);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching data:", error);
      } else {
        setDaftarLaporan(data || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoadingList(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDaftarLaporan();
  }, [fetchDaftarLaporan]);

  // ── Supabase Realtime: auto-update saat status berubah ──────────────────
  useEffect(() => {
    const channel = supabase
      .channel('laporan-guest-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'laporan_kerusakan',
        },
        (payload) => {
          fetchDaftarLaporan();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDaftarLaporan]);

  const asetOptions = useMemo(() => {
    return (aset || []).map((a) => ({
      label: `${a.nama_aset} - NUP ${a.nup || '-'} - ${a.lokasi_ruangan || '-'}`,
      value: a.id,
    }));
  }, [aset]);

  const getAssetDetails = useCallback((idAset) => {
    return (aset || []).find(a => a.id === idAset) || {};
  }, [aset]);

  // ── Submit laporan ke tabel laporan_kerusakan ────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.id_aset) {
      alert('Pilih aset terlebih dahulu!');
      return;
    }
    if (!form.deskripsi) {
      alert('Deskripsi kerusakan wajib diisi!');
      return;
    }

    setLoading(true);
    const payload = {
      id_aset:      Number(form.id_aset),
      nama_pelapor: form.nama_pelapor || currentUser?.nama || 'Guest',
      tingkat:      form.tingkat,
      kendala:      form.deskripsi,   // kolom utama di DB adalah 'kendala'
      tanggal:      new Date().toISOString().split('T')[0],
      status:       'menunggu',
    };

    let error;
    if (editId) {
      const { error: err } = await supabase.from('laporan_kerusakan').update(payload).eq('id', editId);
      error = err;
    } else {
      const { error: err } = await supabase.from('laporan_kerusakan').insert([payload]);
      error = err;
    }
    setLoading(false);

    if (error) {
      alert('Gagal mengirim laporan: ' + error.message);
      return;
    }

    toast.success(editId ? 'Laporan kerusakan berhasil diperbarui!' : 'Laporan kerusakan berhasil dikirim!');

    setForm(makeEmptyForm(currentUser));
    setEditId(null);
    setOpen(false);
    fetchDaftarLaporan();
  };

  const handleEdit = (rep) => {
    setEditId(rep.id);
    setForm({
      id_aset: rep.id_aset,
      nama_pelapor: rep.nama_pelapor,
      tingkat: rep.tingkat,
      deskripsi: rep.kendala || rep.deskripsi
    });
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmCancel = async () => {
    if (!itemToDelete) return;
    const { error } = await supabase.from('laporan_kerusakan').delete().eq('id', itemToDelete.id);
    if (error) {
      alert('Gagal membatalkan: ' + error.message);
      return;
    }
    setDaftarLaporan(prev => prev.filter(r => r.id !== itemToDelete.id));
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // ── Filter & Search ──────────────────────────────────────────────────────
  const filteredReports = useMemo(() => {
    return daftarLaporan.filter(lap => {
      const asetDetail = lap.aset || getAssetDetails(lap.id_aset);
      const kendala    = lap.deskripsi || lap.kendala || '';
      const targetText = `${asetDetail?.nama_aset || ''} ${asetDetail?.kode_aset || ''} ${kendala}`.toLowerCase();
      const matchText  = targetText.includes(filterText.toLowerCase());

      const matchKategori = filterKategori
        ? (asetDetail?.kategori_aset || '') === filterKategori
        : true;

      const matchStatus = filterStatus
        ? lap.status === filterStatus
        : true;

      const tgl = lap.tanggal || '';
      const matchStart = filterStartDate ? tgl >= filterStartDate : true;
      const matchEnd   = filterEndDate   ? tgl <= filterEndDate   : true;

      return matchText && matchKategori && matchStatus && matchStart && matchEnd;
    });
  }, [daftarLaporan, aset, filterText, filterKategori, filterStatus, filterStartDate, filterEndDate]);

  const pagedReports = useMemo(() => {
    return filteredReports.slice((currentPage - 1) * perPage, currentPage * perPage);
  }, [filteredReports, currentPage, perPage]);

  return (
    <div className="space-y-21">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Laporan Perawatan Aset</h1>
          <p className="text-xs text-slate-400 mt-1">{filteredReports.length} laporan kerusakan ditemukan</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditId(null);
            setForm(makeEmptyForm(currentUser));
            setOpen(true);
          }}
        >
          <Plus size={15} /> Lapor Kerusakan
        </Button>
      </div>

      {/* Form Tambah Laporan (Inline Card) */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/40 p-21">
          <p className="text-base font-bold text-slate-700 mb-13 flex items-center gap-2">
            {editId ? '✏️ Edit Laporan Kerusakan' : '⚠️ Laporan Kerusakan Aset Baru'}
          </p>
          <form onSubmit={handleSubmit} className="space-y-13">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-13">
              <SearchableSelect
                label="Pilih Aset Bermasalah"
                required
                options={asetOptions}
                value={form.id_aset}
                onChange={e => setForm({ ...form, id_aset: e.target.value })}
                placeholder="Pilih aset..."
              />
              <Input
                label="Nama Pelapor"
                type="text"
                required
                value={form.nama_pelapor}
                onChange={e => setForm({ ...form, nama_pelapor: e.target.value })}
              />
              <Select
                label="Tingkat Kerusakan"
                required
                options={TINGKAT_OPTIONS}
                value={form.tingkat}
                onChange={e => setForm({ ...form, tingkat: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-5 w-full">
              <label className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                Deskripsi Kerusakan / Kendala
              </label>
              <textarea
                required
                value={form.deskripsi}
                onChange={e => setForm({ ...form, deskripsi: e.target.value })}
                className="w-full px-13 py-13 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none h-28"
                placeholder="Deskripsikan dengan detail kendala atau kerusakan yang dialami..."
              />
            </div>

            <div className="flex justify-end gap-8 pt-5">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setForm(makeEmptyForm(currentUser)); setEditId(null); setOpen(false); }}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} size="sm">
                {loading ? <><Loader2 size={13} className="animate-spin mr-1" /> Mengirim...</> : 'Simpan'}
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
            placeholder="Cari laporan (nama aset, kode, kendala)..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
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
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-8 py-8 text-[10px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"
            >
              <option value="">Semua Status</option>
              <option value="menunggu">Menunggu Pengecekan</option>
              <option value="diverifikasi">Diverifikasi</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>

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
      {loadingList ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 lg:gap-21">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
              <div className="w-full h-40 bg-slate-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <AlertTriangle size={34} className="mx-auto mb-5 text-slate-300" />
          Tidak ada riwayat laporan kerusakan aset.
        </div>
      ) : (
        <div className="space-y-21">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 lg:gap-21 w-full items-start">
            {pagedReports.map(rep => {
              const asetDetail = rep.aset || getAssetDetails(rep.id_aset);
              const status     = rep.status || 'menunggu';
              const kendala    = rep.deskripsi || rep.kendala || '—';

              return (
                <div
                  key={rep.id}
                  className="bg-white p-13 lg:p-0 rounded-2xl border border-slate-100 shadow-sm flex flex-row lg:flex-col gap-13 lg:gap-0 items-center lg:items-stretch overflow-hidden group hover:shadow-md transition-shadow"
                >
                  {/* Container Gambar */}
                  <div className="w-89 h-89 lg:w-full lg:h-48 bg-slate-50 rounded-xl lg:rounded-none lg:border-0 lg:border-b border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {asetDetail?.foto_url || asetDetail?.image_url ? (
                      <img
                        src={asetDetail.foto_url || asetDetail.image_url}
                        alt={asetDetail.nama_aset}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Building2 size={21} className="text-slate-300" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 flex flex-col py-2 lg:p-13">
                    <div className="flex flex-col">
                      {/* Header Mobile: Kategori & Status */}
                      <div className="flex justify-between items-start gap-5 lg:hidden mb-2">
                        <span className="text-[9px] font-mono bg-slate-50 text-slate-500 px-5 py-2 rounded-md font-bold uppercase tracking-wider truncate">
                          {asetDetail?.kategori_aset || 'Umum'}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider shrink-0 ${statusBadge(status)}`}>
                          {statusLabel(status)}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="text-sm font-bold text-slate-800 leading-tight truncate mb-2">
                        {asetDetail?.nama_aset || 'Aset Tidak Dikenal'}
                      </h3>

                      {/* Kendala & Kode Aset */}
                      <p className="text-[10px] font-medium text-slate-500 truncate mt-2 lg:mt-0">
                        <span className="font-semibold text-slate-400">Kendala:</span> <span className="text-slate-600 ml-1">{kendala}</span>
                      </p>

                      <h4 className="hidden lg:block text-[10px] font-mono text-slate-400 truncate mt-2">
                        {asetDetail?.kode_aset || asetDetail?.id || rep.id_aset}
                      </h4>
                    </div>

                    {/* Footer Detail */}
                    <div className="flex justify-between items-end lg:items-end mt-4 pt-4 border-t border-slate-50">
                      <div className="flex flex-col">
                        <span className="hidden lg:block text-[10px] font-semibold text-slate-500 mb-3">
                          Status: <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider ${statusBadge(status)}`}>{statusLabel(status)}</span>
                        </span>
                        <span className="text-xs font-black text-slate-700 leading-none">
                          <span className={`${tingkatColor(rep.tingkat)}`}>{rep.tingkat}</span>
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium mt-1">
                          {rep.tanggal}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-semibold text-slate-600 max-w-[100px] truncate">{rep.nama_pelapor || currentUser?.nama || 'Guest'}</span>
                        {rep.catatan_admin ? (
                          <span className="text-[9px] font-medium text-slate-400 max-w-[100px] truncate italic" title={rep.catatan_admin}>
                            Admin: {rep.catatan_admin}
                          </span>
                        ) : status === 'menunggu' ? (
                          <div className="flex gap-2 mt-1">
                            <button
                              onClick={() => handleEdit(rep)}
                              className="p-1.5 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                              title="Edit Laporan"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => { setItemToDelete(rep); setIsDeleteModalOpen(true); }}
                              className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                              title="Batalkan Laporan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <Pagination
            total={filteredReports.length}
            perPage={perPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPerPageChange={setPerPage}
          />
        </div>
      )}

      {/* ── CUSTOM MODAL KONFIRMASI BATAL ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setItemToDelete(null);
            }}
          />
          <div className="relative bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-21 flex flex-col gap-13 z-10 animate-in fade-in zoom-in-95 duration-150 text-center items-center">
            <div className="mt-8">
              <h3 className="text-lg font-black text-slate-800 tracking-tight mb-8">Batalkan Laporan</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                Yakin ingin membatalkan laporan kerusakan aset <span className="font-bold text-slate-700">"{itemToDelete?.aset?.nama_aset || 'Aset'}"</span>? Laporan akan dihapus.
              </p>
            </div>
            <div className="flex items-center justify-center gap-8 mt-13 w-full">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="px-18 py-8 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all select-none"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-18 py-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm active:scale-95 transition-all select-none"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}