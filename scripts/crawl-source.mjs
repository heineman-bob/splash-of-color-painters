import { mkdir, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

const origin = 'https://www.splashofcolorpainters.com';
const paths = [
  '/', '/interior', '/specials', '/pets', '/exterior', '/faq', '/residential',
  '/copy-of-interior-projects-1', '/pictures', '/partners',
  '/copy-of-interior-projects', '/about', '/request-form',
  '/copy-of-gallery', '/contact',
];

await mkdir('source/raw', { recursive: true });

for (const path of paths) {
  const response = await fetch(`${origin}${path}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; SiteArchive/1.0)' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  const html = await response.text();
  const name = path === '/' ? 'home' : basename(path);
  await writeFile(`source/raw/${name}.html`, html);
  console.log(`${name}: ${html.length} bytes`);
}
