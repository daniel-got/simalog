const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'LaporRusakGuest.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Fix payload to include id_user
content = content.replace(
  /id_aset:\s*Number\(form\.id_aset\),\s*nama_pelapor:\s*form\.nama_pelapor \|\| currentUser\?\.nama \|\| 'Guest',/g,
  `id_aset:      Number(form.id_aset),
      nama_pelapor: form.nama_pelapor || currentUser?.nama || 'Guest',
      id_user:      currentUser?.id || null,`
);

// 2. Fix fetchDaftarLaporan logic
const fetchLogicRegex = /const fetchDaftarLaporan = useCallback\(async \(\) => \{[\s\S]*?setLoadingList\(false\);\s*\}, \[currentUser\?\.nama\]\);/g;

const newFetchLogic = `const fetchDaftarLaporan = useCallback(async () => {
    setLoadingList(true);
    let query = supabase
      .from('laporan_kerusakan')
      .select(\`
        *,
        aset:id_aset ( id, nama_aset, kode_aset, foto_url, lokasi_ruangan, kategori_aset )
      \`)
      .order('created_at', { ascending: false });

    // Filter by User ID if Auth is strict, otherwise by Name for Guest
    if (currentUser?.id) {
      query = query.eq('id_user', currentUser.id);
    } else if (currentUser?.nama) {
      query = query.eq('nama_pelapor', currentUser.nama);
    }

    const { data, error } = await query;
    if (!error) setDaftarLaporan(data || []);
    setLoadingList(false);
  }, [currentUser]);`;

content = content.replace(fetchLogicRegex, newFetchLogic);

// 3. Fix Realtime logic
const realtimeLogicRegex = /useEffect\(\(\) => \{[\s\S]*?if \(!currentUser\?\.nama\) return;[\s\S]*?const channel = supabase[\s\S]*?subscribe\(\);[\s\S]*?return \(\) => \{[\s\S]*?supabase\.removeChannel\(channel\);[\s\S]*?\};[\s\S]*?\}, \[currentUser\?\.nama, fetchDaftarLaporan\]\);/;

const newRealtimeLogic = `useEffect(() => {
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
  }, [fetchDaftarLaporan]);`;

content = content.replace(realtimeLogicRegex, newRealtimeLogic);

// 4. Update UI Filter styling
// Search Input
content = content.replace(
  /<Search size=\{14\} className="absolute left-13 top-1\/2 -translate-y-1\/2 text-slate-400" \/>/,
  '<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />'
);
content = content.replace(
  /className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700"/,
  'className="w-full pl-11 pr-4 py-2.5 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"'
);

// Selects and Datepicker
content = content.replace(
  /className="w-full px-8 py-8 text-\[10px\] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"/g,
  'className="w-full px-4 py-2.5 h-11 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"'
);

// Date Label styling (optional, but keep it clean)
// from `text-[10px] text-slate-400 font-bold uppercase shrink-0`
// no need to change unless requested, but leave it for now.

// Ensure Table action buttons aren't there because this is LaporRusakGuest (which uses cards, not Table usually). 
// Let's write the file.
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Update LaporRusakGuest data & styling completed');
