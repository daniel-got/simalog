const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'Persetujuan.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Ubah font-size dan icon label meta
content = content.replace(/text-\[9px\]/g, 'text-[10px]');
content = content.replace(/size=\{9\}/g, 'size={10}');

// 2. Ubah value class meta
content = content.replace(/text-xs font-semibold text-slate-700/g, 'text-xs font-bold text-slate-700');
content = content.replace(/text-xs text-slate-600/g, 'text-xs font-medium text-slate-600');
content = content.replace(/text-xs font-semibold text-blue-700/g, 'text-xs font-bold text-teal-700');
content = content.replace(/text-xs font-semibold text-orange-700/g, 'text-xs font-bold text-teal-700');

// 3. Ubah tema biru & amber di Section Header dan Icon
content = content.replace(/bg-blue-50/g, 'bg-teal-50');
content = content.replace(/text-blue-600/g, 'text-teal-600');
content = content.replace(/bg-blue-100/g, 'bg-teal-100');
content = content.replace(/text-blue-700/g, 'text-teal-700');
content = content.replace(/bg-blue-500/g, 'bg-teal-500'); // Untuk accent bar Peminjaman
content = content.replace(/hover:border-blue-200/g, 'hover:border-teal-200');

// Section Laporan Kerusakan
// Hanya ubah yang bukan badge severity. Icon header dan hover border
content = content.replace(/w-34 h-34 rounded-xl bg-amber-50/g, 'w-34 h-34 rounded-xl bg-teal-50');
content = content.replace(/AlertTriangle size=\{18\} className="text-amber-600"/g, 'AlertTriangle size={18} className="text-teal-600"');
content = content.replace(/AlertOctagon size=\{16\} className="text-amber-600"/g, 'AlertOctagon size={16} className="text-teal-600"');
content = content.replace(/bg-amber-100 text-amber-700/g, 'bg-teal-100 text-teal-700');
content = content.replace(/hover:border-amber-200/g, 'hover:border-teal-200');

// Verifikasi button (Awalnya biru)
content = content.replace(/bg-blue-600 hover:bg-blue-700/g, 'bg-teal-600 hover:bg-teal-700');
content = content.replace(/shadow-blue-500\/20/g, 'shadow-teal-500/20');
content = content.replace(/border-blue-200/g, 'border-teal-200');

// Simpan kembali
fs.writeFileSync(targetPath, content, 'utf8');
console.log('Update Persetujuan UI done!');
