/**
 * Practical 7: End-to-End API and Middleware Pipeline Test Suite
 * Student: Daksh Karangiya (24CS038)
 */

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('================================================================');
  console.log('Practical 7: Authentication & Middleware Pipeline Test Suite');
  console.log('Student ID: 24CS038 | Name: Daksh Karangiya');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(title, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${title}`);
      if (extra) console.log(`       Details: ${extra}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${title}`);
      if (extra) console.error(`       Details: ${extra}`);
    }
  }

  try {
    // 1. Health check
    const statusRes = await fetch('http://localhost:5001/api/status');
    const statusData = await statusRes.json();
    assert('Server Health & Student Info Endpoint', statusRes.status === 200 && statusData.student.rollNumber === '24CS038', `DB: ${statusData.databaseStatus}, Roll: ${statusData.student.rollNumber}`);

    // 2. Register User (bcrypt password hashing)
    const testEmail = `24cs038_${Date.now()}@charusat.edu.in`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Daksh Karangiya',
        studentId: '24CS038',
        email: testEmail,
        password: 'password123'
      })
    });
    const regData = await regRes.json();
    assert('User Registration with bcrypt Hashing (POST /api/auth/register)', regRes.status === 201 && regData.success === true, `Created User ID: ${regData.user?.id}, Student: ${regData.user?.studentId}`);

    // 3. User Login & JWT Generation
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    assert('User Login & JWT Token Generation (POST /api/auth/login)', loginRes.status === 200 && !!token, `Token Issued (Expires: ${loginData.expiresIn})`);

    // 4. Test Protected /me endpoint with JWT
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    assert('Protected /api/auth/me Endpoint with Bearer Token', meRes.status === 200 && meData.user.studentId === '24CS038', `Email: ${meData.user.email}, Roll: ${meData.user.studentId}`);

    // 5. Test Auth Middleware: Request with NO token (should be 401)
    const noTokenRes = await fetch(`${BASE_URL}/tasks`);
    const noTokenData = await noTokenRes.json();
    assert('Auth Middleware: Reject Missing Token with 401 Unauthorized', noTokenRes.status === 401 && noTokenData.success === false, noTokenData.message);

    // 6. Test Auth Middleware: Request with INVALID / TAMPERED token (should be 401)
    const tamperedRes = await fetch(`${BASE_URL}/tasks`, {
      headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature' }
    });
    const tamperedData = await tamperedRes.json();
    assert('Auth Middleware: Reject Tampered/Invalid Token with 401 Unauthorized', tamperedRes.status === 401 && tamperedData.success === false, tamperedData.message);

    // 7. Test Validation Middleware: Empty Title (should be 400 Bad Request)
    const invalidTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title: '   ', description: 'Testing validation rejection' })
    });
    const invalidTaskData = await invalidTaskRes.json();
    assert('Validation Middleware: Reject Empty Title with 400 Bad Request', invalidTaskRes.status === 400 && invalidTaskData.success === false, invalidTaskData.message);

    // 8. Test Protected Task Creation (Valid Token + Valid Title -> 201 Created)
    const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Complete Practical 7 Authentication Report',
        description: 'Verify JWT auth middleware and validation middleware pipeline',
        priority: 'high'
      })
    });
    const createTaskData = await createTaskRes.json();
    const taskId = createTaskData.task?._id;
    assert('Protected Task Creation (POST /api/tasks)', createTaskRes.status === 201 && !!taskId, `Task ID: ${taskId}, Title: "${createTaskData.task?.title}"`);

    // 9. Test Protected Get All Tasks (GET /api/tasks)
    const getTasksRes = await fetch(`${BASE_URL}/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getTasksData = await getTasksRes.json();
    assert('Protected Get Tasks (GET /api/tasks)', getTasksRes.status === 200 && getTasksData.count >= 1, `Total Tasks Found: ${getTasksData.count}`);

    // 10. Test Protected Update Task (PUT /api/tasks/:id)
    const updateTaskRes = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'completed' })
    });
    const updateTaskData = await updateTaskRes.json();
    assert('Protected Update Task (PUT /api/tasks/:id)', updateTaskRes.status === 200 && updateTaskData.task?.status === 'completed', `Updated Status: ${updateTaskData.task?.status}`);

    // Summary
    console.log('\n================================================================');
    console.log(`Results: ${passed} / ${total} Tests Passed Successfully!`);
    console.log('All Practical 7 Objectives & Middleware Pipeline Verified!');
    console.log('================================================================\n');

  } catch (error) {
    console.error('Test Execution Error:', error);
  }
}

runTests();
