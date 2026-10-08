import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'esbuild';

const root = process.cwd();
const output = path.join(root, '.work', 'android-web');
await fs.mkdir(path.join(output, 'vendor'), { recursive: true });
await fs.mkdir(path.join(output, 'app'), { recursive: true });
let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
html = html
  .replace(/<link[^>]+fonts\.googleapis\.com[^>]*>\s*/g, '')
  .replaceAll('https://html2canvas.hertzen.com/dist/html2canvas.min.js', 'vendor/html2canvas.min.js')
  .replaceAll('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js', 'vendor/gif.js')
  .replaceAll('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js', 'vendor/gif.worker.js');
let nativeAdapterInserted = false;
html = html.replace(/<!--[\s\S]*?-->|<script>/g, (token) => {
  if (token !== '<script>' || nativeAdapterInserted) return token;
  nativeAdapterInserted = true;
  return '<script src="app/platform-native.js"></script>\n<script>window.SQUAD_MAKER_ANALYTICS_ID = "";</script>\n<script>';
});
if (!nativeAdapterInserted) throw new Error('Original app script missing from Android bundle');
if (/https:\/\/(?:html2canvas\.hertzen\.com|cdnjs\.cloudflare\.com)/.test(html)) throw new Error('Remote export asset remains in Android bundle');
await fs.writeFile(path.join(output, 'index.html'), html);
for (const file of ['html2canvas.min.js', 'gif.js', 'gif.worker.js']) {
  await fs.copyFile(path.join(root, 'tests', 'vendor', file), path.join(output, 'vendor', file));
}
await build({ entryPoints: [path.join(root, 'app', 'platform-native.js')], outfile: path.join(output, 'app', 'platform-native.js'),
  bundle: true, format: 'iife', target: 'chrome100', minify: false, sourcemap: false });
for (const file of ['local-library.js']) {
  try { await fs.copyFile(path.join(root, 'app', file), path.join(output, 'app', file)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
await fs.cp(path.join(root, 'app', 'licenses'), path.join(output, 'app', 'licenses'), { recursive: true });
const evidence = { contractVersion: 2, snapshotVersion: 1, libraryVersion: 1, format: 1, offlineExportAssets: {}, analytics: 'disabled', remoteServer: false };
for (const file of ['html2canvas.min.js', 'gif.js', 'gif.worker.js']) {
  const bytes = await fs.readFile(path.join(output, 'vendor', file));
  evidence.offlineExportAssets[file] = crypto.createHash('sha256').update(bytes).digest('hex');
}
await fs.writeFile(path.join(output, 'bundle-manifest.json'), JSON.stringify(evidence, null, 2));
console.log('Android web bundle prepared with local export libraries and analytics disabled.');
