const fs = require('fs');
const path = require('path');

const dir = 'c:\\VRIS_StartUP\\nirvi-elevated-style\\src';

const replacements = [
  { regex: /#ff3f6c/ig, replace: '#e0b090' },
  { regex: /#ff3b6b/ig, replace: '#e0b090' },
  { regex: /#f7b6c8/ig, replace: '#e0b090' },
  { regex: /#e42f5d/ig, replace: '#d6a382' },
  { regex: /#ec2f5f/ig, replace: '#d6a382' },
  { regex: /#e62e5c/ig, replace: '#d6a382' },
  { regex: /#ffcedc/ig, replace: '#ebd1c1' },
  { regex: /#ffd3df/ig, replace: '#ebd1c1' },
  { regex: /#fff1f5/ig, replace: '#fbf5f1' },
  { regex: /#fff1f4/ig, replace: '#fbf5f1' },
  { regex: /rgba\(255,63,108,/ig, replace: 'rgba(224,176,144,' },
  { regex: /rgba\(247,182,200,/ig, replace: 'rgba(224,176,144,' },
  { regex: /bg-pink-50\/40/ig, replace: 'bg-[#e0b090]/10' },
  { regex: /bg-pink-50/ig, replace: 'bg-[#e0b090]/10' },
  { regex: /from-pink-50/ig, replace: 'from-[#e0b090]/10' },
  { regex: /to-rose-100/ig, replace: 'to-[#e0b090]/20' },
  { regex: /from-pink-950\/30/ig, replace: 'from-[#e0b090]/30' },
  { regex: /to-rose-900\/20/ig, replace: 'to-[#e0b090]/20' },
  { regex: /bg-pink-100/ig, replace: 'bg-[#e0b090]/20' },
  { regex: /#fcd5e0/ig, replace: '#ebd1c1' },
  { regex: /#eea3b8/ig, replace: '#d6a382' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(dir);
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  replacements.forEach(r => {
    content = content.replace(r.regex, r.replace);
  });
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
    count++;
  }
});
console.log(`Total files updated: ${count}`);
