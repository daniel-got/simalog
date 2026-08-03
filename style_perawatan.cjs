const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'Perawatan.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Action Buttons
// Replace the flex gap-5 container with flex items-center gap-2 justify-center or justify-start
content = content.replace(
  /<div className="flex gap-5">[\s\S]*?<button[\s\S]*?onClick=\{\(\) => handleEdit\(p\)\}[\s\S]*?className="w-26 h-26 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors"[\s\S]*?title="Edit"[\s\S]*?>[\s\S]*?<Pencil size=\{13\} \/>[\s\S]*?<\/button>[\s\S]*?<button[\s\S]*?onClick=\{\(\) => handleDelete\(p\)\}[\s\S]*?className="w-26 h-26 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"[\s\S]*?title="Hapus"[\s\S]*?>[\s\S]*?<Trash2 size=\{13\} \/>[\s\S]*?<\/button>[\s\S]*?<\/div>/,
  `<div className="flex items-center gap-2 justify-start">
                      <button
                        onClick={() => handleEdit(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>`
);

// 2. Form Filters
// Input Search
content = content.replace(
  /<Search size=\{14\} className="absolute left-13 top-1\/2 -translate-y-1\/2 text-slate-400" \/>\s*<input\s*type="text"\s*placeholder="Cari unit aset, kode, lokasi, atau keterangan\.\.\."\s*value=\{filterText\}\s*onChange=\{e => setFilterText\(e\.target\.value\)\}\s*className="w-full pl-34 pr-13 py-8 text-xs bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"\s*\/>/m,
  `<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari unit aset, kode, lokasi, atau keterangan..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 h-11 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
          />`
);

// Select Kategori
content = content.replace(
  /<select\s*className="w-full px-8 py-8 text-\[10px\] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"\s*value=\{filterKategori\}\s*onChange=\{e => setFilterKategori\(e\.target\.value\)\}\s*>/m,
  `<select
            className="w-full px-4 py-2.5 h-11 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700"
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value)}
          >`
);

// Input Date
content = content.replace(
  /<input\s*type="date"\s*className="w-full px-8 py-8 text-\[10px\] bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-600 font-medium"\s*value=\{filterDate\}\s*onChange=\{e => setFilterDate\(e\.target\.value\)\}\s*\/>/m,
  `<input
            type="date"
            className="w-full px-4 py-2.5 h-11 text-sm font-medium bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-slate-700"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />`
);

// 3. Table Headers
// The table headers in Perawatan.jsx are passed as: headers={['Tanggal', 'Unit Aset & Lokasi', 'Jenis Perawatan', 'Total Biaya', 'Kondisi Aset', 'Keterangan', 'Aksi']}
const newHeaders = `headers={[
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Tanggal</span>,
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Unit Aset & Lokasi</span>,
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Jenis Perawatan</span>,
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Total Biaya</span>,
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Kondisi Aset</span>,
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Keterangan</span>,
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">Aksi</span>
          ]}`;
content = content.replace(/headers=\{\['Tanggal', 'Unit Aset & Lokasi', 'Jenis Perawatan', 'Total Biaya', 'Kondisi Aset', 'Keterangan', 'Aksi'\]\}/, newHeaders);

// 4. Table Row content
// Tanggal: `text-xs text-slate-500 whitespace-nowrap` -> `text-sm font-semibold text-gray-800 whitespace-nowrap`
content = content.replace(/<td className="px-13 py-13 text-xs text-slate-500 whitespace-nowrap">\{p\.tanggal\}<\/td>/, '<td className="px-13 py-13 text-sm font-semibold text-gray-800 whitespace-nowrap">{p.tanggal}</td>');

// Nama Aset: `<span className="text-sm font-bold text-slate-800">{getAsetName(p.id_aset)}</span>` -> `<span className="text-sm font-semibold text-gray-800">{getAsetName(p.id_aset)}</span>`
content = content.replace(/<span className="text-sm font-bold text-slate-800">\{getAsetName\(p\.id_aset\)\}<\/span>/g, '<span className="text-sm font-semibold text-gray-800">{getAsetName(p.id_aset)}</span>');

// Sub-teks lokasi: `<span className="text-[10px] text-slate-400 font-medium">` -> `<span className="text-xs text-gray-500">`
content = content.replace(/<span className="text-\[10px\] text-slate-400 font-medium">/g, '<span className="text-xs text-gray-500">');

// Total biaya: `<td className="px-13 py-13 font-mono text-xs font-bold text-emerald-600">` -> `<td className="px-13 py-13 text-sm font-bold text-emerald-600">`
content = content.replace(/<td className="px-13 py-13 font-mono text-xs font-bold text-emerald-600">/g, '<td className="px-13 py-13 text-sm font-bold text-emerald-600">');

// Keterangan: `<td className="px-13 py-13 text-xs text-slate-500 max-w-\[200px\] truncate">` -> `<td className="px-13 py-13 text-sm text-gray-600 max-w-[200px] truncate">`
content = content.replace(/<td className="px-13 py-13 text-xs text-slate-500 max-w-\[200px\] truncate">/g, '<td className="px-13 py-13 text-sm text-gray-600 max-w-[200px] truncate">');

// Write changes
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Update Perawatan style completed');
