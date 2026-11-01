import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourcePath = path.join(rootDir, 'index.source.html');
const targetPath = path.join(rootDir, 'index.html');

if (fs.existsSync(sourcePath)) {
  fs.copyFileSync(sourcePath, targetPath);
  console.log('[prep-dev] Restored index.html from index.source.html for Vite development.');
} else {
  console.warn('[prep-dev] Warning: index.source.html not found, using existing index.html.');
}
