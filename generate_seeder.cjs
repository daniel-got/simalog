require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ada di file .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🔄 Membaca data aset dari JSON...");
    const rawData = fs.readFileSync(path.join(__dirname, 'data_aset.json'), 'utf-8');
    const assets = JSON.parse(rawData);
    
    console.log("🔄 Fetching kelompok_aset dan sub_kelompok_aset dari Supabase...");
    
    const { data: kelompok, error: errK } = await supabase.from('kelompok_aset').select('*');
    if (errK) {
        console.error("❌ Gagal fetch kelompok:", errK);
        return;
    }
    
    const { data: subKelompok, error: errS } = await supabase.from('sub_kelompok_aset').select('*');
    if (errS) {
        console.error("❌ Gagal fetch sub kelompok:", errS);
        return;
    }

    console.log(`✅ Mendapat ${kelompok.length} Kelompok dan ${subKelompok.length} Sub Kelompok`);

    // Mapping kelompok dari nama JSON -> ID Supabase
    // Default fallback:
    let defaultKelompokId = kelompok.length > 0 ? kelompok[0].id : null;
    let defaultSubKelId = subKelompok.length > 0 ? subKelompok[0].id : null;

    const findKelompok = (guess) => {
        const k = kelompok.find(x => x.nama.toLowerCase().includes(guess.toLowerCase()) || guess.toLowerCase().includes(x.nama.toLowerCase()));
        return k ? k.id : defaultKelompokId;
    };

    const findSubKelompok = (kelId, namaAset) => {
        const subs = subKelompok.filter(x => x.kelompok_id === kelId);
        if (subs.length === 0) return null;
        
        // Coba cocokan dengan nama aset
        const n = namaAset.toLowerCase();
        let match = subs.find(x => n.includes(x.nama.toLowerCase()));
        if (match) return match.id;

        // Fallback berdasarkan kategori umum
        if (kelId === kelompok.find(x => x.prefix_kode === 'ELK')?.id) {
            if (n.includes('ac ') || n.includes('printer') || n.includes('proyektor')) {
                return subs.find(x => x.maintenance_type === 'bulan')?.id || subs[0].id;
            }
            return subs.find(x => x.maintenance_type === 'tidak')?.id || subs[0].id;
        }

        if (kelId === kelompok.find(x => x.prefix_kode === 'KND')?.id) {
            if (n.includes('motor')) return subs.find(x => x.nama.toLowerCase().includes('motor'))?.id || subs[0].id;
            return subs.find(x => x.nama.toLowerCase().includes('mobil'))?.id || subs[0].id;
        }

        return subs[0].id; // Fallback ke sub pertama di kelompok tsb
    };

    console.log("🔄 Menyiapkan Script SQL...");
    let sql = `-- =========================================================================\n`;
    sql += `-- SEEDER IMPORT ASET BMN (Total: ${assets.length} item)\n`;
    sql += `-- =========================================================================\n\n`;

    const CHUNK_SIZE = 100;
    
    for (let i = 0; i < assets.length; i += CHUNK_SIZE) {
        const chunk = assets.slice(i, i + CHUNK_SIZE);
        
        sql += `INSERT INTO public.assets (\n`;
        sql += `  kode_aset, kode_bmn, nup, kelompok_id, sub_kelompok_id, nama_aset, merek_tipe, \n`;
        sql += `  satuan, lokasi_ruangan, penanggung_jawab, status_kondisi, harga_beli, akumulasi_penyusutan, nilai_buku, \n`;
        sql += `  tanggal_perolehan, jenis_bmn, status_operasional, maintenance_type, created_at, updated_at\n`;
        sql += `) VALUES \n`;

        const values = chunk.map((a, idx) => {
            const kelId = findKelompok(a.kelompok_guess);
            const subKelId = findSubKelompok(kelId, a.nama_aset);
            const subData = subKelompok.find(x => x.id === subKelId);
            const mType = subData ? subData.maintenance_type : 'tidak';

            // Escape strings for SQL
            const escapeSql = (str) => {
                if (str === null || str === undefined) return 'NULL';
                return "'" + String(str).replace(/'/g, "''") + "'";
            };

            const kAset = escapeSql(a.kode_aset);
            const kBmn = escapeSql(a.kode_bmn);
            const nup = a.nup || 'NULL';
            const nama = escapeSql(a.nama_aset);
            const merek = escapeSql(a.merek_tipe);
            const sat = escapeSql(a.satuan);
            const lokasi = escapeSql(a.lokasi_ruangan);
            const pj = 'NULL'; // penanggung_jawab
            const kondisi = escapeSql(a.status_kondisi);
            const harga = a.harga_beli || 0;
            const akumulasi = a.akumulasi_penyusutan || 0;
            const nbuku = a.nilai_buku || 0;
            const tgl = escapeSql(a.tanggal_perolehan || new Date().toISOString().split('T')[0]);
            const jenis = escapeSql(a.jenis_bmn);
            const statusOp = escapeSql(a.status_operasional);
            const mt = escapeSql(mType);

            let row = `  (${kAset}, ${kBmn}, ${nup}, ${kelId || 'NULL'}, ${subKelId || 'NULL'}, ${nama}, ${merek}, `;
            row += `${sat}, ${lokasi}, ${pj}, ${kondisi}, ${harga}, ${akumulasi}, ${nbuku}, ${tgl}, ${jenis}, ${statusOp}, ${mt}, now(), now())`;
            return row;
        });

        sql += values.join(',\n') + `\nON CONFLICT (kode_aset) DO UPDATE SET \n  akumulasi_penyusutan = EXCLUDED.akumulasi_penyusutan,\n  nilai_buku = EXCLUDED.nilai_buku;\n\n`;
    }

    fs.writeFileSync(path.join(__dirname, 'seed_bmn_assets.sql'), sql);
    console.log(`🎉 Berhasil! Script SQL disimpan ke: seed_bmn_assets.sql`);
    console.log(`👉 Buka Supabase Dashboard > SQL Editor, lalu copy-paste dan run isi file tersebut.`);
}

run();
