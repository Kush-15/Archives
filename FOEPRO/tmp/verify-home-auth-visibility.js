const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:8000/';
const OUT_DIR = path.join(process.cwd(), 'tmp', 'auth-modal-inspect');
const SHOT_PATH = path.join(OUT_DIR, 'home-auth-visibility-check.png');

function parseAlpha(color) {
  if (!color) return 0;
  const match = color.match(/rgba?\(([^)]+)\)/i);
  if (!match) return 0;
  const parts = match[1].split(',').map((v) => v.trim());
  if (parts.length < 4) return 1;
  const alpha = Number(parts[3]);
  return Number.isFinite(alpha) ? alpha : 0;
}

async function clickSignIn(page) {
  const candidates = [
    page.locator('.arc-nav-auth-link', { hasText: /^sign in$/i }).first(),
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

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const result = {
    page: '/',
    signInClicked: false,
    modalVisible: false,
    checks: {
      navMixBlendModeNormalWhileModalOpen: false,
      navZIndexAtLeast1000: false,
      authLinkAlphaAtLeast045: false,
    },
    computed: {
      navMixBlendMode: null,
      navZIndex: null,
      authLinkColor: null,
      authLinkAlpha: null,
    },
    screenshotPath: SHOT_PATH,
  };

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    result.signInClicked = await clickSignIn(page);

    if (!result.signInClicked) {
      throw new Error('Could not click Sign in on home page');
    }

    const modalLocator = page.locator('.auth-overlay, .auth-panel, #auth-title').first();
    await modalLocator.waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(250);

    const computed = await page.evaluate(() => {
      const nav = document.querySelector('.arc-nav');
      const authLink = document.querySelector('.arc-nav-auth-link');
      const overlay = document.querySelector('.auth-overlay');
      const panel = document.querySelector('.auth-panel');
      const title = document.querySelector('#auth-title');

      const navStyle = nav ? window.getComputedStyle(nav) : null;
      const authStyle = authLink ? window.getComputedStyle(authLink) : null;
      const isVisible = (el) => {
        if (!el) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0;
      };

      return {
        modalVisible: isVisible(overlay) || isVisible(panel) || isVisible(title),
        navMixBlendMode: navStyle ? navStyle.mixBlendMode : null,
        navZIndex: navStyle ? navStyle.zIndex : null,
        authLinkColor: authStyle ? authStyle.color : null,
      };
    });

    result.modalVisible = computed.modalVisible;
    result.computed.navMixBlendMode = computed.navMixBlendMode;
    result.computed.navZIndex = computed.navZIndex;
    result.computed.authLinkColor = computed.authLinkColor;
    result.computed.authLinkAlpha = parseAlpha(computed.authLinkColor);

    const navZ = Number(result.computed.navZIndex);
    result.checks.navMixBlendModeNormalWhileModalOpen = result.modalVisible && computed.navMixBlendMode === 'normal';
    result.checks.navZIndexAtLeast1000 = Number.isFinite(navZ) && navZ >= 1000;
    result.checks.authLinkAlphaAtLeast045 = result.computed.authLinkAlpha >= 0.45;

    await page.screenshot({ path: SHOT_PATH, fullPage: true });
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result));
}

main().catch((err) => {
  const fail = {
    error: err.message,
    stack: err.stack,
  };
  console.log(JSON.stringify(fail));
  process.exit(1);
});
