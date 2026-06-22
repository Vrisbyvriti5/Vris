const fs = require('fs');
const path = require('path');

const dirsToSearch = [
  path.join(__dirname, 'nirvi-elevated-style', 'src'),
  path.join(__dirname, 'nirvi-elevated-style', 'public'),
  path.join(__dirname, 'nirvi-Backend-style', 'controllers'),
  path.join(__dirname, 'nirvi-Backend-style', 'models'),
  path.join(__dirname, 'nirvi-Backend-style', 'config'),
  path.join(__dirname, 'nirvi-Backend-style', 'routes'),
  path.join(__dirname, 'nirvi-Backend-style', 'utils'),
  path.join(__dirname, 'nirvi-Backend-style', 'emails'),
];

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
}

let allFiles = [];
dirsToSearch.forEach(d => {
  allFiles = allFiles.concat(walkSync(d));
});

// Replace contents
allFiles.forEach(file => {
  if (file.match(/\.(js|jsx|json|md|html|css|xml|txt)$/)) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/NIRVI REBORN THREADS/gi, 'VRISBYVRITI');
    content = content.replace(/Nirvi Reborn Threads/g, 'VRISBYVRITI');
    content = content.replace(/NIRVI/g, 'VRIS');
    content = content.replace(/Nirvi/g, 'VRIS');
    content = content.replace(/nirvi/g, 'vris');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
    }
  }
});

// Rename files
allFiles.forEach(file => {
  const baseName = path.basename(file);
  let newBaseName = baseName;
  newBaseName = newBaseName.replace(/NIRVI/g, 'VRIS');
  newBaseName = newBaseName.replace(/Nirvi/g, 'VRIS');
  newBaseName = newBaseName.replace(/nirvi/g, 'vris');
  
  if (baseName !== newBaseName) {
    const newFile = path.join(path.dirname(file), newBaseName);
    fs.renameSync(file, newFile);
  }
});

// Rename directories
dirsToSearch.forEach(startDir => {
  let dirs = [];
  function getDirs(d) {
    if (!fs.existsSync(d)) return;
    fs.readdirSync(d).forEach(f => {
      const dirFile = path.join(d, f);
      if (fs.statSync(dirFile).isDirectory()) {
        dirs.push(dirFile);
        getDirs(dirFile);
      }
    });
  }
  getDirs(startDir);
  
  // Sort by length descending so deeper dirs renamed first
  dirs.sort((a, b) => b.length - a.length);
  
  dirs.forEach(d => {
    const baseName = path.basename(d);
    let newBaseName = baseName;
    newBaseName = newBaseName.replace(/NIRVI/g, 'VRIS');
    newBaseName = newBaseName.replace(/Nirvi/g, 'VRIS');
    newBaseName = newBaseName.replace(/nirvi/g, 'vris');
    
    if (baseName !== newBaseName) {
      const newDir = path.join(path.dirname(d), newBaseName);
      fs.renameSync(d, newDir);
    }
  });
});

console.log('Rebranding complete.');
