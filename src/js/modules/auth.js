import { S } from '../state.js';
import { showToast } from '../helpers.js';

export function authTab(tab, btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('login-form').style.display  = tab === 'login'  ? '' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? '' : 'none';
}

export function forgotPassword() {
  const email = prompt('Enter your email to reset password:');
  if (!email) return;
  // Try real API first, fallback to toast
  if (window.API) {
    window.API.Auth.forgotPassword(email)
      .then(() => showToast('Reset link sent! Check your inbox 📧', 'info'))
      .catch(err => showToast(err.message, 'error'));
  } else {
    showToast('Password reset link sent to ' + email + '! 📧', 'info');
  }
}

// ── LOGIN ─────────────────────────────────────────────────
export async function doLogin() {
  const identifier = document.getElementById('li-u').value.trim();
  const password   = document.getElementById('li-p').value;
  if (!identifier || !password) { showToast('Fill all fields', 'error'); return; }

  const btn = document.querySelector('#login-form .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }

  try {
    // Try real backend first
    if (window.API) {
      try {
        const res = await window.API.Auth.login(identifier, password);
        if (res.data.accessToken) window.API.Auth.storeToken(res.data.accessToken);
        bootUser(res.data.user);
        return;
      } catch (apiErr) {
        // If backend is down, fall through to localStorage
        if (!apiErr.message.includes('Invalid')) throw apiErr;
      }
    }

    // Demo login
    if (identifier === 'demo' && password === 'demo') {
      bootUser({ id: 99, name: 'Demo User', username: 'demo_user', email: 'demo@gurizz.app', age: 20, height: 175, course: 'B.Tech CSE', year: '2nd Year', music: 'Hip-Hop / Rap', nature: 'Ambivert', dob: '2004-06-15', color: '#c0132a', rizzPoints: 0 });
      return;
    }

    // localStorage fallback
    const saved = JSON.parse(localStorage.getItem('gu-rizz-users') || '[]');
    const found = saved.find(x => (x.username === identifier || x.email === identifier) && x.password === password);
    if (!found) { showToast('Invalid username or password', 'error'); return; }
    bootUser(found);

  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Enter the Spark 🔥'; }
  }
}

// ── SIGNUP ────────────────────────────────────────────────
export async function doSignup() {
  const name     = document.getElementById('su-name').value.trim();
  const username = document.getElementById('su-user').value.trim();
  const email    = document.getElementById('su-email').value.trim();
  const age      = document.getElementById('su-age').value;
  const height   = document.getElementById('su-ht').value;
  const course   = document.getElementById('su-course').value;
  const year     = document.getElementById('su-year').value;
  const music    = document.getElementById('su-music').value;
  const nature   = document.getElementById('su-nature').value;
  const dob      = document.getElementById('su-dob').value;
  const password = document.getElementById('su-pass').value;

  if (!name || !username || !age || !height || !course || !year || !music || !nature || !password) {
    showToast('Please fill all mandatory fields!', 'error'); return;
  }
  if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }

  const btn = document.querySelector('#signup-form .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating account...'; }

  try {
    // Try real backend
    if (window.API) {
      try {
        const res = await window.API.Auth.signup({ name, username, personalEmail: email, password, dob });
        if (res.data.accessToken) window.API.Auth.storeToken(res.data.accessToken);
        await window.API.Auth.completeVibeProfile({ age, height, course, year, music, nature, dob });
        bootUser(res.data.user);
        showToast('Welcome to GU-Rizz, ' + name.split(' ')[0] + '! 🔥', 'success');
        return;
      } catch (apiErr) {
        // If backend unavailable, fall through to localStorage
        if (apiErr.message.includes('taken') || apiErr.message.includes('exists')) throw apiErr;
      }
    }

    // localStorage fallback
    const saved = JSON.parse(localStorage.getItem('gu-rizz-users') || '[]');
    if (saved.find(x => x.username === username)) { showToast('Username already taken!', 'error'); return; }
    const newUser = { id: Date.now(), name, username, email, age: +age, height: +height, course, year, music, nature, dob, password, color: '#c0132a', rizzPoints: 0 };
    saved.push(newUser);
    localStorage.setItem('gu-rizz-users', JSON.stringify(saved));
    bootUser(newUser);
    showToast('Welcome to GU-Rizz, ' + name.split(' ')[0] + '! 🔥', 'success');

  } catch (err) {
    showToast(err.message || 'Signup failed', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Create My Profile 🔥'; }
  }
}

// ── BOOT USER ─────────────────────────────────────────────
export function bootUser(user) {
  S.user = { ...user };

  // Persist current user so page refresh keeps them logged in
  localStorage.setItem('gu-rizz-current-user', JSON.stringify(user));

  // Connect socket if available
  if (window.SOCKET) window.SOCKET.connect();

  // renderAll is exposed on window by main.js
  if (window.renderAll) window.renderAll();
  if (window.startTimeTracking) window.startTimeTracking();

  showToast('Welcome back, ' + user.name.split(' ')[0] + '! 🔥', 'success');
}

// ── LOGOUT ────────────────────────────────────────────────
export function logout() {
  if (window.API) window.API.Auth.logout().catch(() => {});
  if (window.API) window.API.Auth.clearToken();
  if (window.SOCKET) window.SOCKET.disconnect();
  if (window.stopTimeTracking) window.stopTimeTracking();

  localStorage.removeItem('gu-rizz-current-user');

  S.user = null; S.posts = [];

  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('app').style.display = 'none';

  showToast('Logged out. See you soon! 👋', 'info');
}
