const fs = require('fs');
const lines = fs.readFileSync('src/components/Navbar.jsx', 'utf8').split('\n');

const newLines = lines.filter((line, index) => {
  if (index === 7) return false; // line 8: import { CATEGORY_TO_COLLECTION...
  if (index >= 10 && index <= 15) return false; // lines 11-16: const categoryGroups...
  return true;
});

newLines.splice(7, 0, "import { toCategoryLabel } from '@/lib/product-taxonomy';");

fs.writeFileSync('src/components/Navbar.jsx', newLines.join('\n'));
