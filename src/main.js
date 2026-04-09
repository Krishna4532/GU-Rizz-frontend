/**
 * GU-Rizz — App Bootstrap
 * Checks existing backend session on every page load.
 * If valid → calls window.bootUser (defined in index.html)
 * If not   → shows auth overlay for login/signup.
 *
 * All module functions are already defined in the inline <script>
 * in index.html. This file only drives the session-restore flow.
 */

// ── Visual initialisation (auth-state-agnostic) ─────────
// Particles and background are already started in index.html's
// window.addEventListener('load'). Nothing extra needed here.

// ── Session check ────────────────────────────────────────
async function bootstrap() {
  // Give the plain <script> tags (api.js, socket.js) a tick to execute
  await new Promise(r => setTimeout(r, 0));

  if (!window.API) {
    // API client not loaded — show auth and wait for user to log in manually
    _showAuth();
    return;
  }

  let sessionUser = null;
  try {
    // Reads the httpOnly cookie the backend sets on login.
    // Throws 401 if no valid session exists.
    const res = await window.API.Auth.me();
    sessionUser = res?.data?.user ?? null;
  } catch {
    sessionUser = null;
  }

  if (sessionUser) {
    // Valid session — boot silently without showing the intro animation
    window.bootUser(sessionUser, !sessionUser.isVibeComplete);
  } else {
    _showAuth();
  }
}

function _showAuth() {
  const overlay = document.getElementById('auth-overlay');
  const app     = document.getElementById('app');
  if (overlay) overlay.style.display = 'flex';
  if (app)     app.style.display     = 'none';
}

// Run immediately — DOM is already ready when this module executes
// (it's deferred by default as type="module")
bootstrap();
