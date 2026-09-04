const fs = require('fs');
const path = require('path');

const srcBase = path.resolve(__dirname, '../src/assets/media');
const dstBase = path.resolve(__dirname, '../public/assets/media');

let count = 0;

function copyWebp(srcDir, dstDir) {
  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }
  const items = fs.readdirSync(srcDir);
  for (const item of items) {
    if (item.startsWith('_originals')) continue;
    const srcPath = path.join(srcDir, item);
    const dstPath = path.join(dstDir, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyWebp(srcPath, dstPath);
    } else if (item.toLowerCase().endsWith('.webp')) {
      fs.copyFileSync(srcPath, dstPath);
      count++;
    }
  }
}

copyWebp(srcBase, dstBase);
console.log(`Successfully copied ${count} .webp files to public/assets/media`);
