export function nav(sec) {
  if (sec === 'about') {
    if (window.showProfileIntro) {
      window.showProfileIntro(() => {
        window.switchSection(sec);
        if (window.renderProfile) window.renderProfile();
      });
    }
    return;
  }
  switchSection(sec);
  if (sec === 'vibe') {
    if (window.renderLeaderboard) window.renderLeaderboard();
    if (window.renderGifts) window.renderGifts();
  }
}

export function switchSection(sec) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const s = document.getElementById('sec-' + sec);
  const l = document.getElementById('nl-' + sec);
  if (s) s.classList.add('active');
  if (l) l.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
