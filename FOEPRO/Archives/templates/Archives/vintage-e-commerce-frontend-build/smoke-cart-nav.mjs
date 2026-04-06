import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8000';
const outputDir = path.resolve(__dirname, 'smoke-artifacts');
const debugPath = path.resolve(__dirname, 'smoke-debug.json');

fs.mkdirSync(outputDir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForBaseUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  let lastError = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${url}/catalog`, { method: 'GET' });
      if (response.ok) {
        return;
      }

      lastError = new Error(`Received status ${response.status} from ${url}/catalog`);
    } catch (error) {
      lastError = error;
    }

    await sleep(1000);
  }

  throw new Error(
    `Unable to reach ${url} within ${timeoutMs}ms. ` +
      `Start Django first (for example: run.bat) and retry. ` +
      `Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}

async function waitForCartDialog(page) {
  await page.waitForSelector('#cart-dialog', { visible: true, timeout: 15000 });
}

async function openCartFromNav(page) {
  await page.evaluate(() => {
    const button = document.querySelector('button[aria-label^="Cart:"]');
    if (!button) {
      throw new Error('Cart button not found');
    }
    button.click();
  });
  await waitForCartDialog(page);
}

async function clickFirstAddToCart(page) {
  await page.hover('.card-lift');
  await page.evaluate(() => {
    const button = document.querySelector('button[aria-label^="Add "]');
    if (!button) {
      throw new Error('Add to cart button not found');
    }
    button.click();
  });
  const cartState = await page.evaluate(() => ({
    href: window.location.href,
    pathname: window.location.pathname,
    cartDialogExists: !!document.querySelector('#cart-dialog'),
    cartDialogVisible: !!document.querySelector('#cart-dialog')?.getClientRects().length,
    cartDialogText: document.querySelector('#cart-dialog')?.textContent?.slice(0, 200) || null,
  }));
  fs.writeFileSync(debugPath, JSON.stringify(cartState, null, 2));
  console.log(`[smoke] after add-to-cart: ${JSON.stringify(cartState)}`);
  await waitForCartDialog(page);
}

async function clickButtonBySelector(page, selector) {
  await page.evaluate((targetSelector) => {
    const button = document.querySelector(targetSelector);
    if (!button) {
      throw new Error(`Unable to find button: ${targetSelector}`);
    }
    button.click();
  }, selector);
}

async function clickButtonWithText(page, text) {
  await page.evaluate((targetText) => {
    const button = Array.from(document.querySelectorAll('button')).find((node) =>
      node.textContent?.includes(targetText)
    );
    if (!button) {
      throw new Error(`Unable to find button with text: ${targetText}`);
    }
    button.click();
  }, text);
}

async function snapshotState(page, label) {
  const state = await page.evaluate(() => ({
    href: window.location.href,
    pathname: window.location.pathname,
    cartDialogExists: !!document.querySelector('#cart-dialog'),
    authDialogExists: !!document.querySelector('#auth-title'),
    authDialogVisible: !!document.querySelector('#auth-title')?.getClientRects().length,
    authDialogText: document.querySelector('#auth-title')?.textContent || null,
  }));
  const snapshotPath = path.resolve(__dirname, `smoke-${label}.json`);
  fs.writeFileSync(snapshotPath, JSON.stringify(state, null, 2));
  console.log(`[smoke] ${label}: ${JSON.stringify(state)}`);
  return state;
}

async function verifyResponsiveNav(page, name, width, height, route) {
  await page.setViewport({ width, height });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav[aria-label="Primary navigation"]', { visible: true, timeout: 15000 });
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: false });
}

console.log(`[smoke-step] waiting for server ${baseUrl}`);
await waitForBaseUrl(baseUrl);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  page.on('console', (message) => {
    const text = message.text();
    // Keep smoke output readable by suppressing high-frequency overlay lifecycle logs.
    if (text.startsWith('[CartSlide]') || text.startsWith('[AuthModal]')) {
      return;
    }
    console.log(`[browser:${message.type()}] ${text}`);
  });
  page.on('pageerror', (error) => {
    console.log(`[browser-error] ${error.message}`);
  });
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      console.log(`[browser:navigation] ${frame.url()}`);
    }
  });

  // Desktop cart flow from catalog.
  console.log('[smoke-step] goto catalog');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/catalog`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav[aria-label="Primary navigation"]', { visible: true, timeout: 15000 });
  await page.waitForSelector('.card-lift', { timeout: 15000 });
  console.log('[smoke-step] add first item');
  await clickFirstAddToCart(page);
  await page.waitForSelector('#cart-dialog', { visible: true, timeout: 15000 });
  await page.waitForSelector('button[aria-label="Increase quantity"]', { visible: true, timeout: 15000 });
  console.log('[smoke-step] quantity adjust and remove');
  await clickButtonBySelector(page, 'button[aria-label="Increase quantity"]');
  await clickButtonBySelector(page, 'button[aria-label="Decrease quantity"]');
  await clickButtonBySelector(page, 'button[aria-label="Remove item"]');

  // Add again, then checkout as guest to verify the auth handoff.
  console.log('[smoke-step] add second item');
  await clickFirstAddToCart(page);
  console.log('[smoke-step] click checkout');
  await clickButtonWithText(page, 'Proceed to Checkout');
  await snapshotState(page, 'after-checkout-click');
  console.log('[smoke-step] wait auth modal');
  await page.waitForSelector('#auth-title', { visible: true, timeout: 15000 });
  console.log('[smoke-step] close auth modal');
  await clickButtonBySelector(page, 'div[aria-labelledby="auth-title"] button[aria-label="Close"]');

  // Cart should still be globally available after route changes.
  console.log('[smoke-step] goto home and open cart');
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav[aria-label="Primary navigation"]', { visible: true, timeout: 15000 });
  await openCartFromNav(page);
  await page.screenshot({ path: path.join(outputDir, 'home-desktop-cart-open.png'), fullPage: false });
  await clickButtonBySelector(page, '#cart-dialog button[aria-label="Close cart"]');

  console.log('[smoke-step] capture desktop and responsive nav screenshots');
  await page.goto(`${baseUrl}/catalog`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('nav[aria-label="Primary navigation"]', { visible: true, timeout: 15000 });
  await page.screenshot({ path: path.join(outputDir, 'catalog-desktop.png'), fullPage: false });

  await verifyResponsiveNav(page, 'home-tablet', 820, 1180, '/');
  await verifyResponsiveNav(page, 'catalog-tablet', 820, 1180, '/catalog');
  await verifyResponsiveNav(page, 'home-mobile', 390, 844, '/');
  await verifyResponsiveNav(page, 'catalog-mobile', 390, 844, '/catalog');

  console.log(`Smoke test complete. Screenshots written to ${outputDir}`);
} finally {
  await browser.close();
}