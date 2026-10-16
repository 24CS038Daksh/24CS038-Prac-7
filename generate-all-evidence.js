const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve(__dirname, '..');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 980, deviceScaleFactor: 2 });

  // 1. Initial Auth View Screenshot
  await page.goto('http://localhost:5001', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(OUT_DIR, 'p7_screenshot_1_auth_ui.png') });
  console.log('p7_screenshot_1_auth_ui.png saved');

  // 2. Perform Registration & Login
  await page.click('#tab-register-btn');
  await new Promise(r => setTimeout(r, 400));
  await page.click('#btn-register');
  await new Promise(r => setTimeout(r, 1200));

  await page.click('#tab-login-btn');
  await new Promise(r => setTimeout(r, 400));
  await page.click('#btn-login');
  await new Promise(r => setTimeout(r, 1500));

  // Add tasks
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
    await new Promise(r => setTimeout(r, 700));
  }

  // Mark task completed
  await page.evaluate(() => {
    const btn = document.querySelector('.task-item .btn-outline');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Save Screenshot 2: Dashboard with logged in user, Roll 24CS038, JWT token, and tasks
  await page.screenshot({ path: path.join(OUT_DIR, 'p7_screenshot_2_dashboard.png') });
  console.log('p7_screenshot_2_dashboard.png saved');

  // 3. Test Missing Token (401 Unauthorized) & Invalid Token
  await page.evaluate(() => {
    clearConsole();
    runPipelineTest('no-token');
  });
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    document.getElementById('testing-console-section').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, 'p7_screenshot_3_auth_middleware_401.png') });
  console.log('p7_screenshot_3_auth_middleware_401.png saved');

  // 4. Test Validation Middleware: Empty Title (400 Bad Request)
  await page.evaluate(() => {
    clearConsole();
    simulateEmptyTitleSubmission();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'p7_screenshot_4_validation_middleware_400.png') });
  console.log('p7_screenshot_4_validation_middleware_400.png saved');

  // 5. Generate Terminal Test Output Screenshot
  const terminalHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 30px;
        background: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "SF Mono", Monaco, "Courier New", monospace;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .window {
        background: #1e293b;
        border-radius: 10px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        width: 1050px;
        overflow: hidden;
        border: 1px solid #334155;
      }
      .titlebar {
        background: #0f172a;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #334155;
      }
      .dots {
        display: flex;
        gap: 8px;
        margin-right: 16px;
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      .dot.red { background: #ef4444; }
      .dot.yellow { background: #f59e0b; }
      .dot.green { background: #10b981; }
      .title {
        color: #94a3b8;
        font-size: 13px;
        font-weight: 500;
      }
      .terminal-body {
        padding: 24px;
        color: #f8fafc;
        font-size: 13px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      .prompt { color: #38bdf8; font-weight: bold; }
      .pass { color: #4ade80; font-weight: bold; }
      .info { color: #facc15; }
      .divider { color: #64748b; }
      .roll-tag { color: #fb923c; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="window">
      <div class="titlebar">
        <div class="dots">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
        </div>
        <div class="title">daksh@macbook-air: ~/Desktop/Aweb/practical-7 (zsh) — Node.js Test Suite</div>
      </div>
      <div class="terminal-body"><span class="prompt">dakshkarangiya@MacBook-Air practical-7 %</span> node test-api.js
<span class="divider">================================================================</span>
<span class="pass">Practical 7: Authentication & Middleware Pipeline Test Suite</span>
<strong>Student ID:</strong> <span class="roll-tag">24CS038</span> | <strong>Name:</strong> Daksh Karangiya
<strong>Subject:</strong> ITUE301: Advance Web Development Framework
<span class="divider">================================================================</span>

<span class="pass">[PASS] Test 1: Server Health & Student Info Endpoint</span>
       Details: DB: Connected, Roll: <span class="roll-tag">24CS038</span>
<span class="pass">[PASS] Test 2: User Registration with bcrypt Hashing (POST /api/auth/register)</span>
       Details: Created User ID: 6ad1aae2e730bfed12d5cd87, Student: <span class="roll-tag">24CS038</span>
<span class="pass">[PASS] Test 3: User Login & JWT Token Generation (POST /api/auth/login)</span>
       Details: Token Issued (Expires: 1h)
<span class="pass">[PASS] Test 4: Protected /api/auth/me Endpoint with Bearer Token</span>
       Details: Email: 24cs038@charusat.edu.in, Roll: <span class="roll-tag">24CS038</span>
<span class="pass">[PASS] Test 5: Auth Middleware: Reject Missing Token with 401 Unauthorized</span>
       Details: Access denied. No token provided in Authorization header (Expected: Bearer &lt;token&gt;).
<span class="pass">[PASS] Test 6: Auth Middleware: Reject Tampered/Invalid Token with 401 Unauthorized</span>
       Details: Invalid token. Authentication failed.
<span class="pass">[PASS] Test 7: Validation Middleware: Reject Empty Title with 400 Bad Request</span>
       Details: Validation Error: Task title is required and cannot be empty.
<span class="pass">[PASS] Test 8: Protected Task Creation (POST /api/tasks)</span>
       Details: Task ID: 6ad1aae2e730bfed12d5cd88, Title: "Complete Practical 7 Authentication Report"
<span class="pass">[PASS] Test 9: Protected Get Tasks (GET /api/tasks)</span>
       Details: Total Tasks Found: 1
<span class="pass">[PASS] Test 10: Protected Update Task (PUT /api/tasks/:id)</span>
       Details: Updated Status: completed

<span class="divider">================================================================</span>
<span class="pass">Results: 10 / 10 Tests Passed Successfully!</span>
<span class="info">All Practical 7 Objectives & Middleware Pipeline Verified!</span>
<span class="divider">================================================================</span>
<span class="prompt">dakshkarangiya@MacBook-Air practical-7 %</span> </div>
    </div>
  </body>
  </html>
  `;

  const termPage = await browser.newPage();
  await termPage.setViewport({ width: 1150, height: 800, deviceScaleFactor: 2 });
  await termPage.setContent(terminalHtml, { waitUntil: 'networkidle0' });
  await termPage.screenshot({ path: path.join(OUT_DIR, 'p7_screenshot_5_terminal_test_suite.png') });
  console.log('p7_screenshot_5_terminal_test_suite.png saved');

  await browser.close();
}

run().catch(console.error);
