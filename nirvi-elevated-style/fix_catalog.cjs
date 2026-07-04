const fs = require('fs');
let c = fs.readFileSync('src/context/CatalogContext.jsx', 'utf8');

c = c.replace(/, getCollectionForCategory/g, '');
c = c.replace(/collection: product\.collection \|\| getCollectionForCategory\(product\.category\) \|\| 'Denim',/g, '');

c = c.replace(/    \/\/ Keep customizationOptions as empty stubs for backward compat\n    customizationOptions: \{ colors: \[\], styles: \[\], addOns: \[\] \},\n    addCustomizationOption: \(\) => \{\},\n    removeCustomizationOption: \(\) => \{\},\n/g, '');

fs.writeFileSync('src/context/CatalogContext.jsx', c);
