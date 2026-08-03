const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// We need to read supabaseUrl and supabaseKey from the project.
// We can use a regex to extract them from .env or src/lib/supabase.js
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
    const { data, error } = await supabase.from('laporan_kerusakan').select('*').limit(1);
    if (error) {
      console.log('Error:', error);
    } else if (data && data.length > 0) {
      console.log('Columns in laporan_kerusakan:');
      console.log(Object.keys(data[0]).join(', '));
    } else {
      console.log('No data found to infer schema.');
      // alternative: try to insert a fake row to see if user_id exists?
    }
  }
  
  check();
} else {
  console.log('Supabase credentials not found.');
}
