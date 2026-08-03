const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env';
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim().replace(/"/g, '');
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim().replace(/"/g, '');
  });
} catch (e) {
  console.log('Error reading .env', e.message);
}

if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  async function check() {
    const { data, error } = await supabase.from('assets').select('*').limit(1);
    if (error) {
      console.log('Error:', error);
    } else if (data && data.length > 0) {
      console.log('Columns in assets:');
      console.log(Object.keys(data[0]).join(', '));
    }
  }
  
  check();
}
