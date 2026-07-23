import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- Fetching kelompok_aset ---');
  const { data: kel, error: kelErr } = await supabase.from('kelompok_aset').select('*');
  if (kelErr) console.error('kelompok_aset error:', kelErr);
  else console.log('kelompok_aset rows:', kel);

  console.log('--- Fetching sub_kelompok_aset ---');
  const { data: sub, error: subErr } = await supabase.from('sub_kelompok_aset').select('*');
  if (subErr) console.error('sub_kelompok_aset error:', subErr);
  else console.log('sub_kelompok_aset rows:', sub);
}

run();
