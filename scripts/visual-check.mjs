import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});

for (const [name, viewport] of [
  ['phone-small-qa.png', { width: 320, height: 700 }],
  ['phone-qa.png', { width: 390, height: 844 }],
  ['tablet-qa.png', { width: 768, height: 1024 }],
  ['desktop-qa.png', { width: 1440, height: 1000 }],
  ['wide-qa.png', { width: 1920, height: 1080 }],
  ['four-k-qa.png', { width: 3840, height: 1400 }],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.screenshot({ path: name, fullPage: false });
  if (viewport.width === 1440) {
    await page.locator('.color-story').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.locator('.color-story').screenshot({ path: 'color-story-qa.png' });
    await page.locator('.work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.locator('.work').screenshot({ path: 'work-section-qa.png' });
  }
  if (viewport.width === 390) {
    await page.locator('.color-story').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.locator('.color-story').screenshot({ path: 'color-story-mobile-qa.png' });
  }
  const metrics = await page.evaluate(() => ({
    documentWidth: document.body.scrollWidth,
    heroWidth: Math.round(document.querySelector('.hero').getBoundingClientRect().width),
    headingSize: getComputedStyle(document.querySelector('h1')).fontSize,
  }));
  console.log(`${name}: viewport ${viewport.width}px, document ${metrics.documentWidth}px, hero ${metrics.heroWidth}px, h1 ${metrics.headingSize}`);
  await page.close();
}

await browser.close();
