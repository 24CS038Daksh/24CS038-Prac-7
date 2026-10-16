// Practical 7: Authentication & Middleware Pipeline Client Script
// Student: Daksh Karangiya (24CS038)

const API_BASE = '/api';
let currentToken = localStorage.getItem('token_24CS038') || null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (currentToken) {
    fetchMe();
    fetchTasks();
  } else {
    updateUIAuthState(false);
  }
});

// UI: Tab Switcher
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegBtn = document.getElementById('tab-register-btn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
    tabLoginBtn.classList.add('active');
    tabRegBtn.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    regForm.classList.remove('hidden');
    tabLoginBtn.classList.remove('active');
    tabRegBtn.classList.add('active');
  }
}

// UI: Alert Banner
function showAlert(message, type = 'info') {
  const alertBox = document.getElementById('alert-box');
  alertBox.className = `alert ${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove('hidden');
  setTimeout(() => {
    alertBox.classList.add('hidden');
  }, 5000);
}

// UI: Auth State Updater
function updateUIAuthState(isLoggedIn, user = null) {
  const authSection = document.getElementById('auth-section');
  const profileSection = document.getElementById('user-profile-section');
  const tokenDisplay = document.getElementById('current-token-display');

  if (isLoggedIn && user) {
    authSection.classList.add('hidden');
    profileSection.classList.remove('hidden');

    document.getElementById('profile-name').textContent = user.name || 'Daksh Karangiya';
    document.getElementById('profile-roll').textContent = user.studentId || '24CS038';
    document.getElementById('profile-email').textContent = user.email || '';
    document.getElementById('profile-id').textContent = user.id || user._id || '';
    tokenDisplay.value = currentToken || '';
  } else {
    authSection.classList.remove('hidden');
    profileSection.classList.add('hidden');
    tokenDisplay.value = '';
    document.getElementById('tasks-list').innerHTML =
      '<p class="placeholder-text">Please login to view and manage protected tasks.</p>';
    document.getElementById('task-count').textContent = '0';
  }
}

// Handler: Register
async function handleRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value;
  const studentId = document.getElementById('reg-roll').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, studentId, email, password })
    });

    const data = await res.json();
    if (res.status === 201) {
      showAlert(`Registration successful for ${data.user.email} (ID: ${data.user.studentId}). You can now login.`, 'success');
      document.getElementById('login-email').value = email;
      document.getElementById('login-password').value = password;
      switchAuthTab('login');
      logToConsole('POST /api/auth/register', { name, studentId, email }, res.status, data);
    } else {
      showAlert(data.message || 'Registration failed.', 'error');
      logToConsole('POST /api/auth/register', { email }, res.status, data);
    }
  } catch (error) {
    showAlert('Network error during registration.', 'error');
  }
}

// Handler: Login
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok && data.token) {
      currentToken = data.token;
      localStorage.setItem('token_24CS038', currentToken);
      showAlert(`Login successful! JWT token generated. Welcome ${data.user.name} (${data.user.studentId}).`, 'success');
      updateUIAuthState(true, data.user);
      fetchTasks();
      logToConsole('POST /api/auth/login', { email }, res.status, {
        success: data.success,
        message: data.message,
        token: `${data.token.substring(0, 25)}... [truncated]`,
        user: data.user
      });
    } else {
      showAlert(data.message || 'Login failed.', 'error');
      logToConsole('POST /api/auth/login', { email }, res.status, data);
    }
  } catch (error) {
    showAlert('Network error during login.', 'error');
  }
}

// Handler: Logout
function handleLogout() {
  currentToken = null;
  localStorage.removeItem('token_24CS038');
  updateUIAuthState(false);
  showAlert('Logged out successfully. JWT cleared from client storage.', 'info');
  logToConsole('CLIENT LOGOUT', {}, 200, { message: 'Token cleared from client.' });
}

// Fetch Current User Profile (/api/auth/me)
async function fetchMe() {
  if (!currentToken) return;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    const data = await res.json();
    if (res.ok) {
      updateUIAuthState(true, data.user);
    } else if (res.status === 401) {
      // Token expired handling
      showAlert('Session expired or unauthorized. Please login again.', 'error');
      handleLogout();
    }
  } catch (error) {
    console.error('fetchMe error:', error);
  }
}

// Fetch Protected Tasks
async function fetchTasks() {
  if (!currentToken) return;

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    const data = await res.json();
    if (res.ok) {
      renderTasks(data.tasks || []);
    } else if (res.status === 401) {
      showAlert('Protected route access denied (401). Token is missing or invalid.', 'error');
      handleLogout();
    }
  } catch (error) {
    console.error('fetchTasks error:', error);
  }
}

// Render Tasks List
function renderTasks(tasks) {
  const container = document.getElementById('tasks-list');
  const countSpan = document.getElementById('task-count');
  countSpan.textContent = tasks.length;

  if (tasks.length === 0) {
    container.innerHTML = '<p class="placeholder-text">No tasks created yet. Add your first task above!</p>';
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-item ${task.status === 'completed' ? 'completed' : ''}">
      <div class="task-content">
        <div class="task-text-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-text-desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          <span class="tag tag-priority-${task.priority}">Priority: ${task.priority}</span>
          <span class="tag tag-status-${task.status}">Status: ${task.status}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-outline btn-sm" onclick="toggleTaskStatus('${task._id}', '${task.status}')">
          ${task.status === 'completed' ? 'Mark Pending' : 'Mark Done'}
        </button>
        <button class="btn btn-danger btn-sm" onclick="deleteTask('${task._id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Create Task
async function handleCreateTask(event) {
  event.preventDefault();
  if (!currentToken) {
    showAlert('Please login first to create protected tasks.', 'error');
    return;
  }

  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-desc').value;
  const priority = document.getElementById('task-priority').value;

  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ title, description, priority })
    });

    const data = await res.json();
    if (res.status === 201) {
      showAlert('Task created successfully via protected route!', 'success');
      document.getElementById('task-title').value = '';
      document.getElementById('task-desc').value = '';
      fetchTasks();
      logToConsole('POST /api/tasks [Protected + Validated]', { title, priority }, res.status, data);
    } else {
      showAlert(data.message || 'Error creating task.', 'error');
      logToConsole('POST /api/tasks [Validation Failed]', { title, priority }, res.status, data);
    }
  } catch (error) {
    showAlert('Network error while creating task.', 'error');
  }
}

// Simulate Empty Title to trigger Validation Middleware (400 Bad Request)
async function simulateEmptyTitleSubmission() {
  if (!currentToken) {
    showAlert('Please login first to test the middleware pipeline.', 'error');
    return;
  }

  try {
    showAlert('Submitting task with EMPTY title to test Server Validation Middleware...', 'info');
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ title: '   ', description: 'Testing validation rejection' })
    });

    const data = await res.json();
    logToConsole('POST /api/tasks (Empty Title)', { title: '   ' }, res.status, data);
    if (res.status === 400) {
      showAlert(`Server Validation Rejection Verified! (Status: 400 Bad Request): ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Error during validation test:', error);
  }
}

// Toggle Task Status
async function toggleTaskStatus(id, currentStatus) {
  const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify({ status: nextStatus })
    });

    const data = await res.json();
    if (res.ok) {
      fetchTasks();
      logToConsole(`PUT /api/tasks/${id}`, { status: nextStatus }, res.status, data);
    } else {
      showAlert(data.message || 'Failed to update task.', 'error');
    }
  } catch (error) {
    console.error('Error updating task:', error);
  }
}

// Delete Task
async function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });

    const data = await res.json();
    if (res.ok) {
      showAlert('Task deleted successfully.', 'info');
      fetchTasks();
      logToConsole(`DELETE /api/tasks/${id}`, {}, res.status, data);
    } else {
      showAlert(data.message || 'Failed to delete task.', 'error');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
  }
}

// Diagnostics & Pipeline Test Runner
async function runPipelineTest(testType) {
  let endpoint = '';
  let options = {};
  let label = '';

  switch (testType) {
    case 'valid-request':
      label = 'Test 1: Request with Valid Token (Protected Task Route)';
      endpoint = `${API_BASE}/tasks`;
      options = {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${currentToken || 'none'}` }
      };
      break;

    case 'no-token':
      label = 'Test 2: Request without Token (Auth Middleware Test)';
      endpoint = `${API_BASE}/tasks`;
      options = {
        method: 'GET',
        headers: {} // No Authorization Header
      };
      break;

    case 'invalid-token':
      label = 'Test 3: Request with Tampered/Invalid Token (Auth Middleware Test)';
      endpoint = `${API_BASE}/tasks`;
      options = {
        method: 'GET',
        headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token' }
      };
      break;

    case 'invalid-input':
      label = 'Test 4: Request with Missing Title (Validation Middleware Test)';
      endpoint = `${API_BASE}/tasks`;
      options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken || 'none'}`
        },
        body: JSON.stringify({ title: '', description: 'Empty title payload' })
      };
      break;

    case 'user-me':
      label = 'Test 5: Fetch User Details (/api/auth/me Supplementary Endpoint)';
      endpoint = `${API_BASE}/auth/me`;
      options = {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${currentToken || 'none'}` }
      };
      break;
  }

  try {
    const res = await fetch(endpoint, options);
    const data = await res.json();
    logToConsole(label, options.body ? JSON.parse(options.body) : options.headers, res.status, data);
    showAlert(`${label} -> Response Status: ${res.status}`, res.status < 400 ? 'success' : 'error');
  } catch (err) {
    logToConsole(label, options, 500, { error: err.message });
  }
}

// Helper: Log formatted messages to verification console
function logToConsole(title, requestPayload, statusCode, responseData) {
  const consoleElem = document.getElementById('console-output');
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `
[${timestamp}] ─── ${title} ───
Status Code: ${statusCode} ${getStatusText(statusCode)}
Request: ${JSON.stringify(requestPayload)}
Response: ${JSON.stringify(responseData, null, 2)}
`;
  consoleElem.textContent = logEntry + '\n' + consoleElem.textContent;
}

function clearConsole() {
  document.getElementById('console-output').textContent = '// Diagnostic logs cleared.';
}

function getStatusText(code) {
  switch (code) {
    case 200: return 'OK';
    case 201: return 'Created';
    case 400: return 'Bad Request (Validation Middleware)';
    case 401: return 'Unauthorized (Auth Middleware)';
    case 404: return 'Not Found';
    case 500: return 'Internal Server Error';
    default: return '';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
