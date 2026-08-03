const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'Persetujuan.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update EmptyState to be more compact
content = content.replace(
  /function EmptyState\(\{ icon: Icon, label \}\) \{[\s\S]*?return \([\s\S]*?py-34[\s\S]*?size=\{28\}[\s\S]*?mb-8[\s\S]*?<\/div>\s*\);\s*\}/,
  `function EmptyState({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center py-13 text-slate-400 bg-slate-50/60 rounded-xl border border-slate-100 border-dashed">
      <Icon size={20} className="mb-3 text-slate-300" />
      <p className="text-[11px] font-medium">{label}</p>
    </div>
  );
}`
);

// 2. Remove Realtime badge and Refresh button from header
// The header block is roughly from `{/* ── Header ── */}` to just before `{/* ═════════`
const headerRegex = /\{\/\*\s*──\s*Header\s*──\s*\*\/\}([\s\S]*?)<div\s+className="flex\s+items-center\s+justify-between">([\s\S]*?)<\/div>\s*\{\/\*\s*════════════/m;
content = content.replace(headerRegex, (match, p1, p2) => {
  return `{/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-4">
            Persetujuan
            {totalPending > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-5 bg-rose-500 text-white text-[10px] font-black rounded-full">
                {totalPending}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Daftar pengajuan peminjaman dan laporan kerusakan yang memerlukan verifikasi.
          </p>
        </div>
      </div>

      {/* ════════════`;
});

// 3. Remove technical text from Section Headers
// Peminjaman
content = content.replace(
  /<p className="text-\[10px\] text-slate-400 mt-1">Dari tabel <code className="font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">peminjaman_aset<\/code> — status: <span className="font-bold text-amber-600">pending<\/span><\/p>/,
  '<p className="text-[10px] text-slate-400 mt-1">Menunggu persetujuan admin</p>'
);

// Kerusakan
content = content.replace(
  /<p className="text-\[10px\] text-slate-400 mt-1">Dari tabel <code className="font-mono bg-slate-100 px-3 py-1 rounded text-slate-600">laporan_kerusakan<\/code> — status: <span className="font-bold text-amber-600">menunggu<\/span><\/p>/,
  '<p className="text-[10px] text-slate-400 mt-1">Menunggu pengecekan & verifikasi</p>'
);

// Optional: clean up unused imports if possible, but leaving them is harmless and avoids breaking things.

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Done refactoring UI');
