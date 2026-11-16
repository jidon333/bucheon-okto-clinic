import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'dist/assets');
await mkdir(path.join(assets, 'fonts'), { recursive: true });
const fontsOnly = process.argv.includes('--fonts-only');
if (!fontsOnly) {
  const bundledRequire = createRequire(path.join(process.argv[2], 'package.json'));
  const sharp = bundledRequire('sharp');
  await sharp(process.argv[3]).webp({ quality: 88 }).toFile(path.join(assets, 'tea-still-life.webp'));
  const forestUrl = 'https://images.unsplash.com/photo-1734386011664-a17cc4ef6755?auto=format&fit=crop&fm=jpg&q=85&w=2200';
  const forestResponse = await fetch(forestUrl);
  if (!forestResponse.ok) throw new Error(`Forest image: ${forestResponse.status}`);
  await sharp(Buffer.from(await forestResponse.arrayBuffer())).resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(assets, 'forest.webp'));
}

const sourceFiles = ['index.html', 'diet.html', 'app.js', 'diet.js', 'diet-model.mjs', 'data/diet-guides.json'];
const sources = await Promise.all(sourceFiles.map(file => readFile(path.join(root, 'dist', file), 'utf8')));
const text = [...new Set((sources.join('\n').replace(/<[^>]*>/g, '') + '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ·→↗↑↓↻✳⌖⧉×沃土八木陽陰金水').replace(/\s+/g, ' '))].join('');
const families = ['Noto Serif KR:wght@400;500', 'Noto Sans KR:wght@400;500;600'];
let css = '';
let fileCount = 0;
const downloaded = new Map();
for (const family of families) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}&display=swap&text=${encodeURIComponent(text)}`;
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36' } });
  if (!response.ok) throw new Error(`Font stylesheet: ${response.status}`);
  let fontCss = await response.text();
  for (const [, fontUrl] of [...fontCss.matchAll(/url\(([^)]+)\)/g)]) {
    if (!downloaded.has(fontUrl)) {
      const fontResponse = await fetch(fontUrl);
      if (!fontResponse.ok) throw new Error(`Font file: ${fontResponse.status}`);
      const filename = `okto-font-${++fileCount}.woff2`;
      await writeFile(path.join(assets, 'fonts', filename), Buffer.from(await fontResponse.arrayBuffer()));
      downloaded.set(fontUrl, filename);
    }
    fontCss = fontCss.replaceAll(fontUrl, downloaded.get(fontUrl));
  }
  css += fontCss + '\n';
}
await writeFile(path.join(assets, 'fonts/fonts.css'), css.trimEnd() + '\n', 'utf8');
const licenseResponse = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/OFL.txt');
if (!licenseResponse.ok) throw new Error('Font license download failed');
const normalizeLicense = value => value.split(/\r?\n/).map(line => line.trimEnd()).join('\n').trimEnd() + '\n';
await writeFile(path.join(assets, 'fonts/OFL-serif.txt'), normalizeLicense(await licenseResponse.text()), 'utf8');
const sansLicenseResponse = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/OFL.txt');
if (!sansLicenseResponse.ok) throw new Error('Sans font license download failed');
await writeFile(path.join(assets, 'fonts/OFL-sans.txt'), normalizeLicense(await sansLicenseResponse.text()), 'utf8');
console.log(`Assets prepared: ${fontsOnly ? '' : 'tea and forest WebP, '}${fileCount} local font files and font licenses.`);
