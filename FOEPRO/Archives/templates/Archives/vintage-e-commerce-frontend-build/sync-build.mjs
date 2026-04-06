import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDist = path.resolve(__dirname, 'dist');
const targetStatic = path.resolve(__dirname, '../../../../Archives/static');
const targetAssets = path.join(targetStatic, 'assets');

if (!fs.existsSync(path.join(sourceDist, 'index.html'))) {
  throw new Error('Missing dist/index.html. Run vite build first.');
}

fs.mkdirSync(targetStatic, { recursive: true });
fs.rmSync(targetAssets, { recursive: true, force: true });
fs.cpSync(path.join(sourceDist, 'assets'), targetAssets, { recursive: true });
fs.copyFileSync(path.join(sourceDist, 'index.html'), path.join(targetStatic, 'index.html'));

console.log(`Synced Vite build into ${targetStatic}`);