const fs = require('fs');
let c = fs.readFileSync('src/components/Navbar.jsx', 'utf8');

c = c.replace(/import \{ CATEGORY_TO_COLLECTION, PRODUCT_COLLECTIONS, toCategoryLabel \} from '@\/lib\/product-taxonomy';/g, '');
c = c.replace(/const categoryGroups = PRODUCT_COLLECTIONS\.map\(\(collection\) => \(\{\n  collection,\n  categories: Object\.entries\(CATEGORY_TO_COLLECTION\)\n    \.filter\(\(\[, group\]\) => group === collection\)\n    \.map\(\(\[category\]\) => category\),\n\}\)\);\n/g, '');

fs.writeFileSync('src/components/Navbar.jsx', c);
