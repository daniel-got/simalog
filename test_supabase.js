import fs from 'fs';
import { supabase } from './src/lib/supabase.js';

async function checkSchema() {
  const { data, error } = await supabase.from('assets').select('id, jenis_bmn').limit(1);
  console.log('Result:', { data, error });
}

checkSchema();
