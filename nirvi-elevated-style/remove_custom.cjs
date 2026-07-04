const fs = require('fs');
let c = fs.readFileSync('src/components/Navbar.jsx', 'utf8');

c = c.replace(/                      <Link to="\/custom-product-request" className=\{profileDropdownItemClass\} role="menuitem">\r?\n                        Custom Orders\r?\n                      <\/Link>\r?\n/g, '');

fs.writeFileSync('src/components/Navbar.jsx', c);
