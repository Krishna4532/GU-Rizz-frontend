import { S } from '../state.js';
import { initials } from '../helpers.js';

export function renderAll() {
  updateNavUI();
  if (window.updateRizzDisplay) window.updateRizzDisplay();
  if (window.renderMiniProfile) window.renderMiniProfile();
  if (window.renderStories) window.renderStories();
  if (window.renderFeed) window.renderFeed();
  if (window.renderSuggested) window.renderSuggested();
  if (window.renderExplore) window.renderExplore();
  if (window.renderChatList) window.renderChatList();
  if (window.renderConfessions) window.renderConfessions();
  if (window.renderLeaderboard) window.renderLeaderboard();
  if (window.renderGifts) window.renderGifts();
  if (window.renderWaitingChips) window.renderWaitingChips();
  if (window.updateLiveCount) window.updateLiveCount();
}

export function updateNavUI() {
  const u = S.user;
  if (!u) return;
  const av = document.getElementById('nav-avatar');
  if (!av) return;
  if (u.avatarDataURL) {
    av.innerHTML = `<img src="${u.avatarDataURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    av.style.background = 'transparent';
  } else {
    av.textContent = initials(u.name);
    av.style.background = u.color || '#c0132a';
  }
}

export function showProfileIntro(cb) {
  const overlay = document.getElementById('profile-intro');
  if (!overlay) { if (cb) cb(); return; }
  const u = S.user;
  const avEl = document.getElementById('intro-av');
  const nameEl = document.getElementById('intro-name');
  const subEl = document.getElementById('intro-sub');
  const rizzEl = document.getElementById('intro-rizz');

  if (nameEl) nameEl.textContent = u.name;
  if (subEl) subEl.textContent = (u.course || 'GU Student') + ' · ' + (u.year || '');
  if (rizzEl) rizzEl.textContent = '⚡ ' + (u.rizzPoints || 0) + ' Rizz Points';

  if (avEl) {
    if (u.avatarDataURL) {
      avEl.innerHTML = `<img src="${u.avatarDataURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" /><div class="av-upload-overlay"></div>`;
    } else {
      avEl.style.background = u.color || '#c0132a';
      avEl.textContent = initials(u.name);
    }
  }

  overlay.classList.add('active');
  setTimeout(() => {
    overlay.classList.remove('active');
    if (cb) cb();
  }, 2000);
}

export function initParticles() {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `width:${size}px;height:${size}px;background:rgba(192,19,42,0.4);left:${Math.random() * 100}%;animation-duration:${Math.random() * 20 + 15}s;animation-delay:${Math.random() * 10}s;`;
    document.body.appendChild(p);
  }
}
