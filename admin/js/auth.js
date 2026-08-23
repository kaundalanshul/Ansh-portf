/**
 * Admin Authentication — auth.js
 * ───────────────────────────────
 * Handles login, token management, and auth redirects.
 * Shared between login page and dashboard.
 */

const API_BASE = 'http://localhost:5000/api';
const TOKEN_KEY = 'portfolio_admin_token';
const ADMIN_KEY = 'portfolio_admin_data';

/* ══════════════════════════════════════════════════
   Token Management
   ══════════════════════════════════════════════════ */

/** Store JWT token and admin data in localStorage */
function setAuth(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

/** Get the stored JWT token */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Get stored admin data */
function getAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY));
  } catch {
    return null;
  }
}

/** Clear auth data and redirect to login */
function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  window.location.href = '/';
}

/** Check if a JWT token is expired */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/** Make an authenticated API request */
async function authFetch(endpoint, options = {}) {
  const token = getToken();

  if (!token || isTokenExpired(token)) {
    logout();
    return null;
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // If unauthorized, redirect to login
    if (response.status === 401) {
      logout();
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Auth fetch error:', error);
    return null;
  }
}

/* ══════════════════════════════════════════════════
   Auth Guards
   ══════════════════════════════════════════════════ */

/** Redirect to dashboard if already logged in (for login page) */
function redirectIfLoggedIn() {
  const token = getToken();
  if (token && !isTokenExpired(token)) {
    window.location.href = '/dashboard.html';
  }
}

/** Redirect to login if not authenticated (for dashboard) */
function requireAuth() {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    logout();
    return false;
  }
  return true;
}

/* ══════════════════════════════════════════════════
   Login Form Handler
   ══════════════════════════════════════════════════ */

const loginForm = document.getElementById('loginForm');

if (loginForm) {
  // If on login page, check if already logged in
  redirectIfLoggedIn();

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginBtn = document.getElementById('loginBtn');
    const loginStatus = document.getElementById('loginStatus');

    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = '⏳ Signing in...';
    loginStatus.className = 'form-status';
    loginStatus.style.display = 'none';

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Store auth data and redirect
        setAuth(result.data.token, result.data.admin);
        window.location.href = '/dashboard.html';
      } else {
        loginStatus.className = 'form-status error';
        loginStatus.textContent = result.message || 'Login failed';
        loginStatus.style.display = 'block';
      }
    } catch (error) {
      loginStatus.className = 'form-status error';
      loginStatus.textContent = 'Network error. Is the server running?';
      loginStatus.style.display = 'block';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = '🔓 Sign In';
    }
  });
}
