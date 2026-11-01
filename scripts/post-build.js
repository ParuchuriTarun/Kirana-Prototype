import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');
const assetsDir = path.join(rootDir, 'assets');
const distAssetsDir = path.join(distDir, 'assets');
const docsAssetsDir = path.join(docsDir, 'assets');

if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[post-build] Error: dist/index.html not found! Build may have failed.');
  process.exit(1);
}

const compiledHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

// 1. Write root index.html
fs.writeFileSync(path.join(rootDir, 'index.html'), compiledHtml, 'utf8');
console.log('[post-build] Copied dist/index.html -> root index.html');

// 2. Ensure docs directory and write docs/index.html
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}
fs.writeFileSync(path.join(docsDir, 'index.html'), compiledHtml, 'utf8');
console.log('[post-build] Copied dist/index.html -> docs/index.html');

// 3. Write 404.html in root and docs for SPA routing
fs.writeFileSync(path.join(rootDir, '404.html'), compiledHtml, 'utf8');
fs.writeFileSync(path.join(docsDir, '404.html'), compiledHtml, 'utf8');
console.log('[post-build] Wrote SPA fallback 404.html in root and docs/');

// 4. Copy assets from dist/assets to root assets/ and docs/assets/
if (fs.existsSync(distAssetsDir)) {
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  if (!fs.existsSync(docsAssetsDir)) fs.mkdirSync(docsAssetsDir, { recursive: true });

  const assetFiles = fs.readdirSync(distAssetsDir);
  for (const file of assetFiles) {
    const srcFile = path.join(distAssetsDir, file);
    fs.copyFileSync(srcFile, path.join(assetsDir, file));
    fs.copyFileSync(srcFile, path.join(docsAssetsDir, file));
  }
  console.log(`[post-build] Synced ${assetFiles.length} asset files to assets/ and docs/assets/`);
}

// 5. Ensure .nojekyll in root, dist, and docs
const noJekyll = '';
fs.writeFileSync(path.join(rootDir, '.nojekyll'), noJekyll, 'utf8');
fs.writeFileSync(path.join(distDir, '.nojekyll'), noJekyll, 'utf8');
fs.writeFileSync(path.join(docsDir, '.nojekyll'), noJekyll, 'utf8');
console.log('[post-build] Ensured .nojekyll across root, dist/, and docs/');

// 6. Ensure CNAME
const cname = 'forgei.qzz.io\n';
fs.writeFileSync(path.join(rootDir, 'CNAME'), cname, 'utf8');
fs.writeFileSync(path.join(distDir, 'CNAME'), cname, 'utf8');
fs.writeFileSync(path.join(docsDir, 'CNAME'), cname, 'utf8');
console.log('[post-build] Ensured CNAME (forgei.qzz.io) across root, dist/, and docs/');

console.log('[post-build] Build post-processing complete successfully.');
