import { S } from '../state.js';
import { initials, showToast } from '../helpers.js';

export function switchExploreTab(tab) {
  document.querySelectorAll('.explore-tab').forEach(function(t) { t.classList.remove('active'); });
  var tabs = document.querySelectorAll('.explore-tab');
  if (tabs.length > 1) tabs[tab === 'search' ? 0 : 1].classList.add('active');
  document.getElementById('explore-search-view').style.display = tab === 'search'  ? 'block' : 'none';
  document.getElementById('explore-filter-view').style.display = tab === 'filters' ? 'block' : 'none';
  renderExplore();
}

export function renderExplore() {
  var isSearchTab = document.getElementById('explore-search-view') && document.getElementById('explore-search-view').style.display !== 'none';
  var container   = document.getElementById('explore-results');
  if (!container) return;
  container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text3);font-size:13px;">Searching...</div>';

  var params = {};
  if (isSearchTab) {
    var q = document.getElementById('explore-search-input') && document.getElementById('explore-search-input').value.trim();
    if (q) params.q = q;
  } else {
    var fC = document.getElementById('f-course') && document.getElementById('f-course').value;
    var fY = document.getElementById('f-year')   && document.getElementById('f-year').value;
    var fG = document.getElementById('f-gender') && document.getElementById('f-gender').value;
    var fHMin = document.getElementById('f-h-min') && document.getElementById('f-h-min').value;
    var fHMax = document.getElementById('f-h-max') && document.getElementById('f-h-max').value;
    if (fC) params.course = fC;
    if (fY) params.year   = fY;
    if (fG) params.gender = fG;
    if (fHMin) params.minHeight = fHMin;
    if (fHMax) params.maxHeight = fHMax;
    if (S.filterState && S.filterState.music && S.filterState.music.length)  params.music  = S.filterState.music.join(',');
    if (S.filterState && S.filterState.nature && S.filterState.nature.length) params.nature = S.filterState.nature[0];
  }

  window.API.Users.explore(params)
    .then(function(res) {
      var users = res.data.users || [];
      if (!users.length) { container.innerHTML = '<div style="text-align:center;color:var(--text3);padding:3rem;font-size:15px;">No users found 🤷</div>'; return; }
      container.innerHTML = '<div class="users-grid">' + users.map(function(u) {
        var img = u.profileImageURL;
        var av  = img ? '<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />' : initials(u.name);
        return '<div class="user-card">' +
          '<div class="uc-av" style="background:'+(u.color||'#888')+'">' + av + '</div>' +
          '<div class="uc-name">' + u.name + '</div>' +
          '<div class="uc-sub">@' + u.username + '</div>' +
          '<div class="uc-tags">' +
            (u.course ? '<span class="uc-tag">'+u.course+'</span>' : '') +
            (u.year   ? '<span class="uc-tag">'+u.year+'</span>'   : '') +
            (u.nature ? '<span class="uc-tag">'+u.nature+'</span>' : '') +
            (u.height ? '<span class="uc-tag">'+u.height+'cm</span>' : '') +
          '</div>' +
          (u.rizzPoints ? '<div class="uc-rizz">⚡ ' + u.rizzPoints.toLocaleString() + ' Rizz</div>' : '') +
          '<button class="follow-btn '+(u.isFollowing?'following':'')+'" onclick="window.toggleFollowExplore(\''+u._id+'\',this)">' +
            (u.isFollowing ? 'Following' : 'Follow') +
          '</button>' +
        '</div>';
      }).join('') + '</div>';
    })
    .catch(function(err) {
      container.innerHTML = '<div style="text-align:center;color:var(--text3);padding:2rem;">' + (err.message||'Search failed') + '</div>';
    });
}

export function toggleChip(el, type) {
  el.classList.toggle('on');
  var v = el.textContent.trim();
  if (!S.filterState) S.filterState = { music: [], nature: [] };
  if (el.classList.contains('on')) S.filterState[type].push(v);
  else S.filterState[type] = S.filterState[type].filter(function(x) { return x !== v; });
}

export function clearFilters() {
  ['f-course','f-year','f-h-min','f-h-max','f-gender'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('on'); });
  S.filterState = { music: [], nature: [] };
  renderExplore();
  showToast('Filters cleared', 'info');
}

export function toggleFollow(uid) {
  return window.API.Users.follow(uid)
    .then(function(res) {
      showToast(res.data.isFollowing ? 'Following! 🙌' : 'Unfollowed', res.data.isFollowing ? 'success' : 'info');
      if (window.renderMiniProfile) window.renderMiniProfile();
      return res.data.isFollowing;
    })
    .catch(function(err) { showToast(err.message, 'error'); return false; });
}

export function toggleFollowExplore(uid, btn) {
  window.API.Users.follow(uid)
    .then(function(res) {
      btn.textContent = res.data.isFollowing ? 'Following' : 'Follow';
      btn.className   = 'follow-btn ' + (res.data.isFollowing ? 'following' : '');
      showToast(res.data.isFollowing ? 'Following! 🙌' : 'Unfollowed', 'success');
    })
    .catch(function(err) { showToast(err.message, 'error'); });
}

export function gainFollower() {}
