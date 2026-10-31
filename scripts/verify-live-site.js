const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const LIVE_URL = 'https://harmonious-squirrel-5cbd03.netlify.app';

async function verifyLiveSite() {
  console.log(`Launching browser with ${executablePath}...`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Root redirect check
    console.log(`\n--- Test 1: Root redirect to /login ---`);
    const rootRes = await page.goto(`${LIVE_URL}/`, { waitUntil: 'networkidle0', timeout: 20000 });
    console.log(`Root status: ${rootRes.status()}`);
    console.log(`Current URL after root load: ${page.url()}`);
    
    // Wait for router hydration if needed
    await page.waitForFunction(() => window.location.href.includes('/login'), { timeout: 10000 });
    console.log(`Verified redirect to: ${page.url()}`);

    // Wait for content
    await page.waitForSelector('text/HB Plus Workspace', { timeout: 10000 }).catch(() => null);
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    const hasAppName = bodyText.includes('HB Plus Workspace');
    const hasWelcomeBack = bodyText.includes('Welcome Back');
    const hasGoogleButton = bodyText.includes('Continue with Google') || bodyText.includes('Google');

    console.log(`Page has "HB Plus Workspace": ${hasAppName}`);
    console.log(`Page has "Welcome Back": ${hasWelcomeBack}`);
    console.log(`Page has Google button: ${hasGoogleButton}`);

    if (!hasAppName || !hasWelcomeBack || !hasGoogleButton) {
      throw new Error(`Login page missing required text elements. Preview:\n${bodyText.slice(0, 300)}`);
    }

    // Save screenshot
    const screenshotDir = path.join(__dirname, '..', 'docs', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const screenshotPath = path.join(screenshotDir, 'live-login.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Live login screenshot saved to: ${screenshotPath}`);

    // 2. Direct /dashboard navigation while logged out
    console.log(`\n--- Test 2: Direct /dashboard navigation while logged out ---`);
    const dashRes = await page.goto(`${LIVE_URL}/dashboard`, { waitUntil: 'networkidle0', timeout: 20000 });
    console.log(`Dashboard response status: ${dashRes.status()}`);
    
    await page.waitForFunction(() => window.location.href.includes('/login'), { timeout: 10000 });
    console.log(`Dashboard redirected to: ${page.url()}`);

    // 3. Fresh reload of /login
    console.log(`\n--- Test 3: Fresh reload of /login ---`);
    const loginReloadRes = await page.goto(`${LIVE_URL}/login`, { waitUntil: 'networkidle0', timeout: 20000 });
    console.log(`Login fresh load status: ${loginReloadRes.status()}`);
    if (loginReloadRes.status() === 404) {
      throw new Error('/login returned 404!');
    }

    // 4. Fresh reload of /dashboard
    console.log(`\n--- Test 4: Fresh reload of /dashboard ---`);
    const dashReloadRes = await page.goto(`${LIVE_URL}/dashboard`, { waitUntil: 'networkidle0', timeout: 20000 });
    console.log(`Dashboard fresh load status: ${dashReloadRes.status()}`);
    if (dashReloadRes.status() === 404) {
      throw new Error('/dashboard returned 404!');
    }
    await page.waitForFunction(() => window.location.href.includes('/login'), { timeout: 10000 });
    console.log(`Dashboard fresh reload redirected to: ${page.url()}`);

    // 5. Check console errors
    console.log(`\n--- Test 5: Console error check ---`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
    } else {
      console.log('Zero console errors detected.');
    }

    console.log('\nAll Live Site Verification Tests PASSED successfully!');
  } finally {
    await browser.close();
  }
}

verifyLiveSite().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
