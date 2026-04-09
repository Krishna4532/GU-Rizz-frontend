import { S } from '../state.js';

export function addNotification(icon, bg, msg, time) {
  if (!S.notifications) S.notifications = [];
  S.notifications.unshift({ id: Date.now(), icon: icon, bg: bg, msg: msg, time: time, unread: true });
  renderNotifBadge();
  renderNotifList();
}

export function renderNotifBadge() {
  var count = (S.notifications || []).filter(function(n) { return n.unread; }).length;
  var badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (count > 0) { badge.textContent = count > 99 ? '99+' : count; badge.classList.remove('notif-hidden'); }
  else { badge.classList.add('notif-hidden'); }
}

export function renderNotifList() {
  var list = document.getElementById('notif-list');
  if (!list) return;
  if (!(S.notifications || []).length) {
    list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text3);font-size:14px;">No notifications yet 🔔</div>';
    return;
  }
  list.innerHTML = (S.notifications || []).map(function(n) {
    return '<div class="notif-item ' + (n.unread ? 'unread' : '') + '" onclick="window.markNotifRead(' + JSON.stringify(n.id) + ')">' +
      '<div class="notif-icon" style="background:' + (n.bg||'rgba(192,19,42,0.15)') + '">' + (n.icon||'🔔') + '</div>' +
      '<div class="notif-text"><div class="notif-msg">' + n.msg + '</div><div class="notif-time">' + n.time + '</div></div>' +
      (n.unread ? '<div class="notif-unread-dot"></div>' : '') +
      '</div>';
  }).join('');
}

export function markNotifRead(id) {
  var n = (S.notifications || []).find(function(x) { return x.id == id; });
  if (n) n.unread = false;
  renderNotifBadge();
  renderNotifList();
  window.API.Notifications.markRead([String(id)]).catch(function() {});
}

export function clearNotifs() {
  (S.notifications || []).forEach(function(n) { n.unread = false; });
  renderNotifBadge();
  renderNotifList();
  window.API.Notifications.markRead().catch(function() {});
}

export function toggleNotifPanel() {
  var panel = document.getElementById('notif-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) renderNotifList();
}
