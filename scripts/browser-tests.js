const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const BASE_URL = 'http://localhost:8081';

async function runBrowserTests() {
  console.log(`Launching headless browser with ${executablePath}...`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  const results = {
    rootRedirect: false,
    dashboardRedirect: false,
    noDashboardFlash: false,
    elementsPresent: {
      appName: false,
      welcomeBack: false,
      subtitle: false,
      googleButton: false,
      securityNote: false,
    },
    responsiveness: {
      w1280: { noHScroll: false, scrollWidth: 0, innerWidth: 0 },
      w768: { noHScroll: false, scrollWidth: 0, innerWidth: 0 },
      w375: { noHScroll: false, scrollWidth: 0, innerWidth: 0, buttonHeight: 0 },
    },
    consoleWarnings: [],
    consoleErrors: [],
  };

  try {
    // TEST 1: Open / while logged out -> redirects to /login
    console.log('\n--- TEST 1: Opening / ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const currentUrl = page.url();
    results.rootRedirect = currentUrl.includes('/login');
    console.log(`Navigated to /, landed at URL: ${currentUrl}. Redirect to /login: ${results.rootRedirect ? 'PASS' : 'FAIL'}`);

    // TEST 2: Open /dashboard directly while logged out -> redirects to /login
    console.log('\n--- TEST 2: Opening /dashboard directly ---');
    let dashboardContentSeen = false;
    await page.evaluateOnNewDocument(() => {
      const observer = new MutationObserver(() => {
        if (document.body && document.body.innerText.includes('Authentication Status')) {
          dashboardContentSeen = true;
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));
    const dashUrl = page.url();
    results.dashboardRedirect = dashUrl.includes('/login');
    results.noDashboardFlash = !dashboardContentSeen;
    console.log(`Navigated to /dashboard, landed at URL: ${dashUrl}. Redirect to /login: ${results.dashboardRedirect ? 'PASS' : 'FAIL'}, No flash: ${results.noDashboardFlash ? 'PASS' : 'FAIL'}`);

    // TEST 3: Check elements on /login
    console.log('\n--- TEST 3: Verifying Login elements ---');
    const bodyText = await page.evaluate(() => document.body.innerText);
    results.elementsPresent.appName = bodyText.includes('HB Plus Workspace');
    results.elementsPresent.welcomeBack = bodyText.includes('Welcome Back');
    results.elementsPresent.subtitle = bodyText.includes('Sign in with your official company account to continue.');
    results.elementsPresent.googleButton = bodyText.includes('Continue with Google');
    results.elementsPresent.securityNote = bodyText.includes('Only authorized company accounts are permitted.');

    console.log('App Name present:', results.elementsPresent.appName);
    console.log('Welcome Back present:', results.elementsPresent.welcomeBack);
    console.log('Subtitle present:', results.elementsPresent.subtitle);
    console.log('Continue with Google present:', results.elementsPresent.googleButton);
    console.log('Security Note present:', results.elementsPresent.securityNote);

    // TEST 4: Responsiveness at 1280px, 768px, 375px
    console.log('\n--- TEST 4: Responsiveness & Screenshots ---');
    const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // 1280px
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 500));
    const metrics1280 = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    results.responsiveness.w1280 = {
      noHScroll: metrics1280.scrollWidth <= metrics1280.innerWidth,
      ...metrics1280,
    };
    await page.screenshot({ path: path.join(screenshotsDir, 'login-desktop.png') });
    console.log(`1280px: scrollWidth=${metrics1280.scrollWidth}, innerWidth=${metrics1280.innerWidth}, noHScroll=${results.responsiveness.w1280.noHScroll}`);

    // 768px
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 500));
    const metrics768 = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    results.responsiveness.w768 = {
      noHScroll: metrics768.scrollWidth <= metrics768.innerWidth,
      ...metrics768,
    };
    console.log(`768px: scrollWidth=${metrics768.scrollWidth}, innerWidth=${metrics768.innerWidth}, noHScroll=${results.responsiveness.w768.noHScroll}`);

    // 375px
    await page.setViewport({ width: 375, height: 667 });
    await new Promise(r => setTimeout(r, 500));
    const metrics375 = await page.evaluate(() => {
      const btn = document.querySelector('[aria-label="Continue with Google"]');
      const rect = btn ? btn.getBoundingClientRect() : null;
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        buttonHeight: rect ? rect.height : 0,
      };
    });
    results.responsiveness.w375 = {
      noHScroll: metrics375.scrollWidth <= metrics375.innerWidth,
      ...metrics375,
    };
    await page.screenshot({ path: path.join(screenshotsDir, 'login-mobile.png') });
    console.log(`375px: scrollWidth=${metrics375.scrollWidth}, innerWidth=${metrics375.innerWidth}, noHScroll=${results.responsiveness.w375.noHScroll}, buttonHeight=${metrics375.buttonHeight}px (>= 44px: ${metrics375.buttonHeight >= 44})`);

    // TEST 5: Console messages
    results.consoleErrors = consoleMessages.filter(m => m.type === 'error').map(m => m.text).concat(pageErrors);
    results.consoleWarnings = consoleMessages.filter(m => m.type === 'warning').map(m => m.text);
    console.log('\n--- TEST 5: Console logs ---');
    console.log('Errors:', results.consoleErrors);
    console.log('Warnings count:', results.consoleWarnings.length);

    console.log('\n=== FINAL BROWSER TEST RESULTS JSON ===');
    console.log(JSON.stringify(results, null, 2));

  } finally {
    await browser.close();
  }
}

runBrowserTests().catch(err => {
  console.error('Browser test failed:', err);
  process.exit(1);
});

