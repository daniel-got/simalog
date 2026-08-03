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
  Clock, AlertTriangle, X, Loader2
} from 'lucide-react';

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

  const [open, setOpen]     = useState(false);
  const [form, setForm]     = useState(() => makeEmptyForm(currentUser));
  const [loading, setLoading] = useState(false);

  // Data laporan dari tabel laporan_kerusakan
  const [daftarLaporan, setDaftarLaporan] = useState([]);
  const [loadingList, setLoadingList]     = useState(true);

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
    return (aset || []).map(a => ({
      label: `${a.nama_aset} — ${a.kode_aset || a.id} (${a.lokasi_ruangan || 'Tanpa Lokasi'})`,
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

    const { error } = await supabase.from('laporan_kerusakan').insert([payload]);
    setLoading(false);

    if (error) {
      alert('Gagal mengirim laporan: ' + error.message);
      return;
    }

    setForm(makeEmptyForm(currentUser));
    setOpen(false);
    fetchDaftarLaporan();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Laporan Perawatan Aset</h1>
          <p className="text-xs text-slate-400 mt-1">{filteredReports.length} laporan kerusakan ditemukan</p>
        </div>
        <Button
          size="sm"
          onClick={() => setOpen(!open)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
        >
          {open ? <X size={15} /> : <Plus size={15} />}
          <span className="ml-1">{open ? 'Tutup Form' : 'Lapor Kerusakan'}</span>
        </Button>
      </div>

      {/* Form Tambah Laporan (Inline Card) */}
      {open && (
        <Card className="border-teal-200 bg-teal-50/40 p-21">
          <p className="text-base font-bold text-slate-700 mb-13 flex items-center gap-2">
            ⚠️ Laporan Kerusakan Aset Baru
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
              <Button type="button" variant="ghost" size="sm" onClick={() => { setForm(makeEmptyForm(currentUser)); setOpen(false); }}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                {loading ? <><Loader2 size={13} className="animate-spin mr-1" /> Mengirim...</> : 'Simpan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Baris Filter & Pencarian */}
      <div className="bg-slate-50 p-13 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari laporan (nama aset, kode, kendala)..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <select
              value={filterKategori}
              onChange={e => setFilterKategori(e.target.value)}
              className="w-full px-4 py-2.5 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
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
              className="w-full px-4 py-2.5 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
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
              className="w-full px-4 py-2.5 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-5">
            <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Smp</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-full px-4 py-2.5 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-13 lg:gap-21 w-full">
            {pagedReports.map(rep => {
              const asetDetail = rep.aset || getAssetDetails(rep.id_aset);
              const status     = rep.status || 'menunggu';
              const kendala    = rep.deskripsi || rep.kendala || '—';

              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                >
                  {/* Gambar Aset */}
                  <div className="w-full h-40 rounded-t-2xl overflow-hidden bg-slate-100 flex items-center justify-center relative flex-shrink-0">
                    {asetDetail?.foto_url || asetDetail?.image_url ? (
                      <img
                        src={asetDetail.foto_url || asetDetail.image_url}
                        alt={asetDetail.nama_aset}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Building2 size={34} className="text-slate-300" />
                    )}
                    <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-500 font-bold text-[9px] px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wider">
                      {asetDetail?.kategori_aset || 'Umum'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-4">
                    {/* Nama & Kode */}
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">
                        {asetDetail?.nama_aset || 'Aset Tidak Dikenal'}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        {asetDetail?.kode_aset || asetDetail?.id || rep.id_aset}
                      </p>
                    </div>

                    {/* Info detail */}
                    <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-600 mb-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Kendala</span>
                        <span className="text-slate-600 text-right max-w-[60%] line-clamp-2">{kendala}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Tingkat</span>
                        <span className={`font-bold ${tingkatColor(rep.tingkat)}`}>{rep.tingkat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Tgl Lapor</span>
                        <span className="text-slate-600">{rep.tanggal}</span>
                      </div>
                      {/* Tampilkan catatan admin jika ada */}
                      {rep.catatan_admin && (
                        <div className="flex flex-col gap-1 pt-1 border-t border-slate-200">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Catatan Admin</span>
                          <span className="text-xs text-slate-600 italic">{rep.catatan_admin}</span>
                        </div>
                      )}
                    </div>

                    {/* Badge Status */}
                    <div className="mb-2">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider inline-block ${statusBadge(status)}`}>
                        {statusLabel(status)}
                      </span>
                    </div>

                    {/* Footer divider */}
                    <div className="border-t border-slate-100 pt-3 mt-auto flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1 min-w-0">
                        <User size={12} className="shrink-0" />
                        <span className="truncate font-semibold">{currentUser?.nama || 'Guest'}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock size={10} />
                        <span>{rep.tanggal}</span>
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
    </div>
  );
}