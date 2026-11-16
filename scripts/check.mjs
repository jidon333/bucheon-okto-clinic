import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { validateGuides } from '../dist/diet-model.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const pages = new Map(await Promise.all(['index.html', 'diet.html'].map(async file => [file, await readFile(path.join(root, file), 'utf8')])));
for (const [file, html] of pages) {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: Duplicate IDs`);
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|tel:)/.test(url)) continue;
    const [pathname, anchor] = url.split('#');
    if (pathname) await access(path.join(root, pathname));
    if (anchor) {
      const target = pathname ? pages.get(pathname) : html;
      assert(target?.includes(`id="${anchor}"`), `${file}: Missing anchor ${url}`);
    }
  }
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${file}: Expected one primary heading`);
  assert(html.includes('lang="ko"'));
  assert(!/noindex|nofollow/i.test(html), `${file}: Public site must allow search indexing`);
  const canonical = file === 'index.html' ? 'https://octohan.com/' : 'https://octohan.com/diet';
  assert(html.includes(`<link rel="canonical" href="${canonical}">`), `${file}: Incorrect public canonical URL`);
  assert(html.includes(`<meta property="og:url" content="${canonical}">`), `${file}: Share URL must match canonical`);
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(json);
  assert(!html.includes('\uFFFD'), `${file}: Invalid encoding`);
  assert(!/href="#"/.test(html), `${file}: Placeholder link`);
}
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
assert(robots.includes('User-agent: *') && robots.includes('Allow: /') && !/^Disallow:\s*\//m.test(robots), 'Crawlers must be allowed');
assert(robots.includes('Sitemap: https://octohan.com/sitemap.xml'));
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), ['https://octohan.com/', 'https://octohan.com/diet']);
const data = validateGuides(JSON.parse(await readFile(path.join(root, 'data/diet-guides.json'), 'utf8')));
for (const guide of data.guides) for (const asset of [guide.image, guide.pdf]) if (asset) await access(path.join(root, asset));
console.log('PASS: both pages, local assets, cross-page anchors, Korean encoding and validated dietary data');
