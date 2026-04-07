const { chromium } = require('playwright');

const baseUrl = 'http://127.0.0.1:8000/catalog';

async function clickNav(page, label) {
  const candidates = [
    page.getByRole('link', { name: new RegExp(`^${label}$`, 'i') }).first(),
    page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first(),
    page.locator(`nav :text-is("${label}")`).first(),
    page.locator(`:text-is("${label}")`).first(),
  ];

  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.click({ timeout: 5000 });
      return true;
    }
  }
  return false;
}

async function closeModal(page) {
  const closeSelectors = [
    '[data-bs-dismiss="modal"]',
    '.btn-close',
    '.modal .close',
    '#auth-modal .btn-close',
    '#auth-modal [aria-label="Close"]',
    '[aria-label="Close"]',
  ];

  for (const selector of closeSelectors) {
    const el = page.locator(selector).first();
    if (await el.count()) {
      try {
        await el.click({ timeout: 2000 });
        await page.locator('#auth-title').waitFor({ state: 'hidden', timeout: 3000 });
        return true;
      } catch (_) {
      }
    }
  }

  await page.keyboard.press('Escape');
  try {
    await page.locator('#auth-title').waitFor({ state: 'hidden', timeout: 3000 });
    return true;
  } catch (_) {
    return false;
  }
}

async function run() {
  const result = {
    signInPass: false,
    registerPass: false,
    signInTitle: null,
    registerTitle: null,
    consoleErrors: [],
    likelyReason: null,
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      result.consoleErrors.push(`[${type}] ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    result.consoleErrors.push(`[pageerror] ${error.message}`);
  });

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const signInClicked = await clickNav(page, 'Sign in');
    if (!signInClicked) {
      result.likelyReason = 'Could not find clickable nav item labeled "Sign in".';
      console.log(JSON.stringify(result));
      return;
    }

    await page.locator('#auth-title').waitFor({ state: 'visible', timeout: 7000 });
    result.signInTitle = (await page.locator('#auth-title').first().innerText()).trim();
    result.signInPass = true;

    const closed = await closeModal(page);
    if (!closed) {
      result.likelyReason = 'Auth modal did not close after Sign in, blocking Register flow.';
      console.log(JSON.stringify(result));
      return;
    }

    const registerClicked = await clickNav(page, 'Register');
    if (!registerClicked) {
      result.likelyReason = 'Could not find clickable nav item labeled "Register".';
      console.log(JSON.stringify(result));
      return;
    }

    await page.locator('#auth-title').waitFor({ state: 'visible', timeout: 7000 });
    result.registerTitle = (await page.locator('#auth-title').first().innerText()).trim();
    result.registerPass =
      !!result.registerTitle &&
      !!result.signInTitle &&
      result.registerTitle.toLowerCase() !== result.signInTitle.toLowerCase() &&
      /(sign\s*up|register|create\s*account)/i.test(result.registerTitle);

    if (!result.registerPass) {
      result.likelyReason =
        'Register click opened modal, but title did not switch to a signup/register variant.';
    }
  } catch (error) {
    result.likelyReason = error.message;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result));
}

run();
