import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

const pages = [
  ['home', '/'], ['interior', '/interior'], ['specials', '/specials'],
  ['pets', '/pets'], ['exterior', '/exterior'], ['faq', '/faq'],
  ['residential', '/residential'], ['interior-projects', '/copy-of-interior-projects-1'],
  ['pictures', '/pictures'], ['partners', '/partners'],
  ['exterior-projects', '/copy-of-interior-projects'], ['about', '/about'],
  ['request-form', '/request-form'], ['gallery', '/copy-of-gallery'], ['contact', '/contact'],
];
const contentOnly = process.argv.includes('--content-only');

const decode = (value) => value
  .replace(/\\u002F/g, '/').replace(/\\\//g, '/')
  .replace(/â€‹/g, '').replace(/Â©/g, '©')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&quot;|&#34;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&copy;/g, '©').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
  .replace(/&ldquo;|&rdquo;/g, '“').replace(/&lsquo;|&rsquo;/g, '’')
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

const textOnly = (html) => decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
  .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();

await mkdir('source/content', { recursive: true });
await mkdir('public/assets/source', { recursive: true });

const assets = new Map();
const colorCounts = new Map();

for (const [name, route] of pages) {
  const rawName = name === 'interior-projects' ? 'copy-of-interior-projects-1'
    : name === 'exterior-projects' ? 'copy-of-interior-projects'
    : name === 'gallery' ? 'copy-of-gallery' : name;
  const html = await readFile(`source/raw/${rawName}.html`, 'utf8');
  const clean = html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '');
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || name);
  const description = decode(html.match(/<meta[^>]+(?:name|property)="(?:description|og:description)"[^>]+content="([^"]*)"/i)?.[1] || '');
  const blocks = [];
  const seen = new Set();
  for (const match of clean.matchAll(/<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const tag = match[1].toLowerCase();
    const value = textOnly(match[2]);
    if (!value || value.length > 1200 || seen.has(value) || value.includes('top of pageSplash of Color Painters')) continue;
    seen.add(value);
    if (tag.startsWith('h')) blocks.push(`${'#'.repeat(Number(tag[1]) + 1)} ${value}`);
    else if (tag === 'li') blocks.push(`- ${value}`);
    else blocks.push(value);
  }
  const markdown = `---\nsource: https://www.splashofcolorpainters.com${route}\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\narchived: 2026-09-29\n---\n\n# ${title}\n\n${blocks.join('\n\n')}\n`;
  await writeFile(`source/content/${name}.md`, markdown);

  const normalized = decode(html);
  for (const match of normalized.matchAll(/https:\/\/static\.wixstatic\.com\/media\/[^"'<>\\\s]+/g)) {
    const full = match[0].replace(/&amp;/g, '&');
    const original = full.split('/v1/')[0].split('?')[0];
    if (/\.(?:jpe?g|png|webp|gif|svg)$/i.test(original)) assets.set(original, true);
  }
  for (const match of html.matchAll(/--color_(\d+):\s*(\d+),(\d+),(\d+)/g)) {
    const hex = `#${[match[2], match[3], match[4]].map(v => Number(v).toString(16).padStart(2, '0')).join('')}`;
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }
  console.log(`${name}: ${blocks.length} content blocks`);
}

const manifest = [];
let index = 0;
for (const url of contentOnly ? [] : assets.keys()) {
  index += 1;
  const remoteName = decodeURIComponent(basename(new URL(url).pathname));
  const extension = extname(remoteName).toLowerCase() || '.jpg';
  const stem = remoteName.slice(0, -extension.length).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 70) || 'image';
  const localName = `${String(index).padStart(3, '0')}-${stem}${extension}`;
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!response.ok) { console.warn(`SKIP ${response.status} ${url}`); continue; }
  await writeFile(`public/assets/source/${localName}`, Buffer.from(await response.arrayBuffer()));
  manifest.push({ file: localName, source: url });
  console.log(`asset ${index}/${assets.size}: ${localName}`);
}

if (!contentOnly) await writeFile('source/assets.json', JSON.stringify(manifest, null, 2) + '\n');
const palette = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
await writeFile('source/color-profile.md', `# Source color profile\n\nExtracted from the Wix theme variables across all archived pages on 2026-09-29. Repeated values indicate greater prominence in the source theme.\n\n| Hex | RGB | Occurrences |\n|---|---|---:|\n${palette.map(([hex, count]) => `| \`${hex}\` | ${hex.slice(1).match(/../g).map(x => parseInt(x, 16)).join(', ')} | ${count} |`).join('\n')}\n`);
await writeFile('source/README.md', `# Splash of Color source archive\n\nPublic site content captured from [splashofcolorpainters.com](https://www.splashofcolorpainters.com/) on 2026-09-29.\n\n- \`content/\`: one Markdown file per sitemap page\n- \`raw/\`: original Wix HTML snapshots\n- \`assets.json\`: local-to-source image manifest\n- \`color-profile.md\`: source Wix theme palette\n- \`../public/assets/source/\`: downloaded original image assets\n\nThe redesigned site uses selected assets from this archive while preserving the full source set for reference.\n`);

console.log(`Archived ${pages.length} pages${contentOnly ? '' : ` and ${manifest.length} image assets`}.`);
