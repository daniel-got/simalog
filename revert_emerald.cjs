const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'HartaBenda', 'LaporRusakGuest.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Revert all emerald back to teal
content = content.replace(/emerald/g, 'teal');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Reverted all emerald to teal');
