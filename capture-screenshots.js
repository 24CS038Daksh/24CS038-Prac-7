const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve(__dirname, '..');

async function capture() {
  console.log('Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 920, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:5001...');
  await page.goto('http://localhost:5001', { waitUntil: 'networkidle0' });

  // 1. Initial State Screenshot
  console.log('Capturing Screenshot 1: Login & Setup View...');
  await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_1_auth_ui.png') });

  // 2. Perform Registration
  console.log('Performing registration...');
  await page.click('#tab-register-btn');
  await new Promise(r => setTimeout(r, 400));
  await page.click('#btn-register');
  await new Promise(r => setTimeout(r, 1200));

  // 3. Perform Login
  console.log('Performing login...');
  await page.click('#tab-login-btn');
  await new Promise(r => setTimeout(r, 400));
  await page.click('#btn-login');
  await new Promise(r => setTimeout(r, 1500));

  // 4. Add Tasks
  console.log('Adding practical tasks...');
  const tasksToAdd = [
    { title: 'Implement JWT Authentication & bcrypt Hashing', desc: 'Secure passwords using salt rounds 10 and sign JWT with 1h expiry', priority: 'high' },
    { title: 'Create Auth Middleware (verify Bearer Token)', desc: 'Extract token from Authorization header and attach req.user', priority: 'high' },
    { title: 'Implement Task Input Validation Middleware', desc: 'Reject empty title before database with 400 Bad Request', priority: 'medium' },
    { title: 'Implement /api/auth/me Profile Route', desc: 'Fetch user details using decoded token payload', priority: 'medium' }
  ];

  for (const t of tasksToAdd) {
    await page.evaluate((task) => {
      document.getElementById('task-title').value = task.title;
      document.getElementById('task-desc').value = task.desc;
      document.getElementById('task-priority').value = task.priority;
    }, t);
    await page.click('#btn-add-task');
    await new Promise(r => setTimeout(r, 800));
  }

  // Mark first task completed
  await page.evaluate(() => {
    const firstTaskBtn = document.querySelector('.task-item .btn-outline');
    if (firstTaskBtn) firstTaskBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // 5. Run tests in the diagnostics console
  console.log('Running diagnostics buttons in web app...');
  await page.evaluate(() => {
    runPipelineTest('valid-request');
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    runPipelineTest('no-token');
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    runPipelineTest('invalid-token');
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    runPipelineTest('invalid-input');
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    runPipelineTest('user-me');
  });
  await new Promise(r => setTimeout(r, 600));

  // 6. Capture Screenshot 2: Logged in Dashboard with Tasks & User Profile
  console.log('Capturing Screenshot 2: Active User Dashboard & Tasks...');
  await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_2_dashboard.png') });

  // 7. Scroll down to show full diagnostics console and capture Screenshot 3
  console.log('Capturing Screenshot 3: Middleware Pipeline Diagnostics...');
  await page.evaluate(() => {
    document.getElementById('testing-console-section').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, 'screenshot_3_diagnostics.png') });

  await browser.close();
  console.log('Screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
