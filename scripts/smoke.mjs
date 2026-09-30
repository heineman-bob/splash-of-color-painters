import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});
const failures = [];
let verifiedImages = 0;
for (const viewport of [
  { width: 320, height: 700 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1024, height: 900 },
  { width: 1440, height: 1000 }, { width: 1920, height: 1080 },
  { width: 2560, height: 1200 }, { width: 3840, height: 1400 },
]) {
  const page = await browser.newPage({ viewport });
  page.on('response', response => { if (response.status() >= 400) failures.push(`${viewport.width}px: ${response.status()} ${response.url()}`); });
  page.on('pageerror', error => failures.push(`${viewport.width}px: ${error.message}`));
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  if (viewport.width <= 920) {
    await page.locator('.menu-toggle').click();
    if (!(await page.locator('.site-nav').evaluate(el => el.classList.contains('open')))) failures.push(`${viewport.width}px: mobile navigation did not open`);
    await page.locator('.menu-toggle').click();
  }
  const widths = await page.evaluate(() => ({ document: document.body.scrollWidth, viewport: innerWidth }));
  if (widths.document > widths.viewport) failures.push(`${viewport.width}px: horizontal overflow to ${widths.document}px`);
  const images = await page.locator('img[src]').count();
  for (let index = 0; index < images; index += 1) {
    await page.locator('img[src]').nth(index).scrollIntoViewIfNeeded();
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(300);
  const loadedImages = await page.locator('img[src]').evaluateAll(items => items.filter(item => item.complete && item.naturalWidth > 0).length);
  if (loadedImages !== images) failures.push(`${viewport.width}px: ${images - loadedImages} image(s) did not load`);
  verifiedImages = images;
  if (await page.locator('h1').textContent() !== 'A home well-loved deserves a finish to match.') failures.push(`${viewport.width}px: hero heading mismatch`);
  await page.close();
}
await browser.close();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Responsive smoke check passed at 8 widths from 320px to 3840px: ${verifiedImages} images loaded, navigation works, and no overflow or browser/HTTP errors were found.`);
