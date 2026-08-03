const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'Perawatan.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update EmptyState to be compact like Persetujuan
content = content.replace(
  /<div className="text-center py-34 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100 border-dashed">[\s\S]*?<Wrench size=\{28\} className="mx-auto mb-5 text-slate-300" \/>[\s\S]*?Belum ada catatan perawatan aset\.[\s\S]*?<\/div>/,
  `<div className="flex flex-col items-center justify-center py-13 text-slate-400 bg-slate-50/60 rounded-xl border border-slate-100 border-dashed">
          <Wrench size={20} className="mb-3 text-slate-300" />
          <p className="text-[11px] font-medium">Belum ada catatan perawatan aset.</p>
        </div>`
);

// 2. Update Font Weights in the Form Card (KM Servis)
content = content.replace(/text-\[10px\] font-semibold text-slate-400 uppercase/g, 'text-[10px] font-bold text-slate-400 uppercase');
content = content.replace(/text-sky-800/g, 'text-teal-800');
content = content.replace(/text-sky-600/g, 'text-teal-600');
content = content.replace(/text-sky-700/g, 'text-teal-700');
content = content.replace(/bg-sky-50\/80/g, 'bg-teal-50/80');
content = content.replace(/border-sky-200\/90/g, 'border-teal-200/90');
content = content.replace(/border-sky-100/g, 'border-teal-100');
content = content.replace(/border-sky-200/g, 'border-teal-200');

// 3. Update Font Weights in the Table
content = content.replace(/<span className="text-sm font-semibold text-slate-800">\{getAsetName\(p\.id_aset\)\}<\/span>/g, '<span className="text-sm font-bold text-slate-800">{getAsetName(p.id_aset)}</span>');

// 4. Update the "kode_aset" text styling to look like Logistik Badges (teal badge)
content = content.replace(
  /<span className="text-\[10px\] font-mono text-slate-400 mt-0\.5">\s*\{asetObj\?\.kode_aset \|\| '—'\} · \{asetObj\?\.lokasi_ruangan \|\| '-'\}\s*<\/span>/,
  `<div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/60">
                          {asetObj?.kode_aset || '—'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {asetObj?.lokasi_ruangan || '-'}
                        </span>
                      </div>`
);

// 5. Change "bg-orange-50 text-orange-700" to "bg-rose-50 text-rose-600" for Perbaikan to match Logistik standard (which uses rose for issues)
content = content.replace(/bg-orange-50 text-orange-700/g, 'bg-rose-50 text-rose-600');

// Save changes
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Done refactoring Perawatan UI');
