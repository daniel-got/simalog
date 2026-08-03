const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'DaftarAset.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add import { Input, Select } from '../../components/ui/Input';
if (!content.includes("import { Input, Select }")) {
  content = content.replace(
    "import { Table } from '../../components/ui/Table';",
    "import { Table } from '../../components/ui/Table';\nimport { Input, Select } from '../../components/ui/Input';"
  );
}

// 2. Remove INPUT_CLASS, SELECT_CLASS, LABEL_CLASS
content = content.replace(/const INPUT_CLASS =[\s\S]*?;\n/, '');
content = content.replace(/const SELECT_CLASS =[\s\S]*?;\n/, '');
content = content.replace(/const LABEL_CLASS =[\s\S]*?;\n/, '');

// We will just do manual replace for the exact code blocks. It's safer.
// I will write out the exact block from <form ...> to </form>
// Actually, using a script to write a new file completely could be tricky if I miss something. Let me just use `multi_replace_file_content` because I can just pass the string to the API.
