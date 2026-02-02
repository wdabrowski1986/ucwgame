// tools/generate_sw_assets.js
// Scans the workspace for static assets (images, core files) and injects them into sw.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const imagesDir = path.join(root, 'images');
const swPath = path.join(root, 'sw.js');

function getImageFiles() {
  try {
    return fs.readdirSync(imagesDir).filter(f => f && !f.startsWith('.'));
  } catch (e) {
    console.error('Failed to read images directory', e);
    return [];
  }
}

function toAssetList(extra = []) {
  const basics = ['/', '/index.html', '/style.css', '/JS/mechanics.js', '/JS/moves.js', '/JS/secrets.js', '/manifest.json'];
  const images = getImageFiles().map(f => '/images/' + f.replace(/\\\\/g, '/'));
  const all = [...basics, ...extra, ...images];
  return all;
}

function formatArrayForJS(arr) {
  return arr.map(a => `  '${a.replace(/'/g, "\\'")}',`).join('\n');
}

function inject() {
  const assets = toAssetList();
  const formatted = formatArrayForJS(assets);
  let content = fs.readFileSync(swPath, 'utf8');
  const start = '/* AUTO_GENERATED_ASSETS_START */';
  const end = '/* AUTO_GENERATED_ASSETS_END */';
  const startIdx = content.indexOf(start);
  const endIdx = content.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    console.error('Markers not found in sw.js. Please ensure AUTO_GENERATED_ASSETS_START/END exist.');
    process.exit(1);
  }

  const before = content.slice(0, startIdx + start.length);
  const after = content.slice(endIdx);
  const newContent = `${before}\n\n${formatted}\n\n${after}`;
  fs.writeFileSync(swPath, newContent, 'utf8');
  console.log('sw.js updated with', assets.length, 'assets');
}

if (require.main === module) {
  inject();
}

module.exports = { inject, toAssetList };