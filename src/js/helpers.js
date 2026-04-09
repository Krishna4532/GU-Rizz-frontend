import { S } from './state.js';
import { USERS } from './data.js';

export const initials = n => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

export const timeAgo = ts => {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now';
  if (d < 3600000) return Math.floor(d / 60000) + 'm';
  if (d < 86400000) return Math.floor(d / 3600000) + 'h';
  return Math.floor(d / 86400000) + 'd';
};

export const getUserById = id => USERS.find(u => u.id === id);

export const myAvSrc = () => S.user?.avatarDataURL || null;

export function avatarHTML(user, size = 40, className = '') {
  const u = user || S.user;
  const s = size;
  const bg = u.color || '#c0132a';
  const init = initials(u.name);
  const src = u.id === (S.user?.id || 99) ? myAvSrc() : null;
  if (src) return `<div class="${className}" style="width:${s}px;height:${s}px;border-radius:50%;overflow:hidden;"><img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" /></div>`;
  return `<div class="${className}" style="width:${s}px;height:${s}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:700;font-size:${Math.round(s * 0.35)}px;">${init}</div>`;
}

export function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3200);
}

export function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
