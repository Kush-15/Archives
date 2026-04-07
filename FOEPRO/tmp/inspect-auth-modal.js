const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:8000';
const OUT_DIR = path.join(process.cwd(), 'tmp', 'auth-modal-inspect');

async function clickSignIn(page) {
  const candidates = [
    page.getByRole('button', { name: /^sign in$/i }).first(),
    page.getByRole('link', { name: /^sign in$/i }).first(),
    page.locator('nav :text-is("Sign in")').first(),
    page.locator(':text-is("Sign in")').first(),
  ];

  for (const target of candidates) {
    if (await target.count()) {
      await target.click({ timeout: 8000 });
      return true;
    }
  }
  return false;
}

async function inspectRoute(browser, routeName, routePath) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const clicked = await clickSignIn(page);
  if (!clicked) {
    throw new Error(`Could not click Sign in on ${routePath}`);
  }

  await page.locator('.auth-overlay').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('.auth-panel').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(250);

  const data = await page.evaluate(() => {
    const overlay = document.querySelector('.auth-overlay');
    const panel = document.querySelector('.auth-panel');
    if (!overlay || !panel) {
      throw new Error('Auth modal elements not found');
    }

    const modalRoot = panel.parentElement || overlay.parentElement;
    const fixedRoot = panel.closest('.fixed.inset-0');
    const overlayStyle = window.getComputedStyle(overlay);
    const panelStyle = window.getComputedStyle(panel);
    const rootStyle = modalRoot ? window.getComputedStyle(modalRoot) : null;

    const nav = document.querySelector('.arc-nav');
    const navStyle = nav ? window.getComputedStyle(nav) : null;

    return {
      route: window.location.pathname,
      overlay: {
        backgroundColor: overlayStyle.backgroundColor,
        backdropFilter: overlayStyle.backdropFilter,
      },
      panel: {
        backgroundColor: panelStyle.backgroundColor,
        color: panelStyle.color,
        opacity: panelStyle.opacity,
        mixBlendMode: panelStyle.mixBlendMode,
        filter: panelStyle.filter,
      },
      modalRoot: {
        className: modalRoot ? modalRoot.className : null,
        zIndex: rootStyle ? rootStyle.zIndex : null,
        fixedRootClassName: fixedRoot ? fixedRoot.className : null,
        fixedRootZIndex: fixedRoot ? window.getComputedStyle(fixedRoot).zIndex : null,
      },
      nav: navStyle
        ? {
            className: nav.className,
            mixBlendMode: navStyle.mixBlendMode,
            filter: navStyle.filter,
            opacity: navStyle.opacity,
          }
        : null,
    };
  });

  const shotPath = path.join(OUT_DIR, `${routeName}-auth-modal.png`);
  await page.screenshot({ path: shotPath, fullPage: true });
  await page.close();
  return { data, screenshot: shotPath };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    const home = await inspectRoute(browser, 'home', '/');
    const catalog = await inspectRoute(browser, 'catalog', '/catalog');

    const output = {
      generatedAt: new Date().toISOString(),
      home,
      catalog,
    };

    const outPath = path.join(OUT_DIR, 'computed-styles.json');
    fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
