import { S } from '../state.js';
import { initials, showToast } from '../helpers.js';

export function renderMiniProfile() {
  var u = S.user; if (!u) return;
  var av = document.getElementById('pm-av');
  if (av) {
    if (u.profileImageURL) { av.innerHTML='<img src="'+u.profileImageURL+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'; av.style.background='transparent'; }
    else { av.textContent=initials(u.name); av.style.background=u.color||'#c0132a'; }
  }
  var s = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=v; };
  s('pm-name', u.name);
  s('pm-handle', '@'+(u.username||'user'));
  s('pm-posts', u.postsCount || S.posts.length);
  s('pm-followers', u.followersCount || 0);
  s('pm-following', u.followingCount || 0);
}

export function renderProfile() {
  var u = S.user; if (!u) return;
  var av = document.getElementById('prof-main-av');
  if (av) {
    if (u.profileImageURL) { av.innerHTML='<img src="'+u.profileImageURL+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/><div class="av-upload-overlay" onclick="window.showAvatarOptions()">📷</div>'; av.style.background='transparent'; }
    else { av.innerHTML=initials(u.name)+'<div class="av-upload-overlay" onclick="window.showAvatarOptions()">📷</div>'; av.style.background=u.color||'#c0132a'; }
  }
  var s = function(id,v){ var el=document.getElementById(id); if(el) el.textContent=(v||'—'); };
  s('prof-full-name', u.name);
  s('prof-handle', '@'+(u.username||'user'));
  s('prof-posts', u.postsCount||0);
  s('prof-followers', u.followersCount||0);
  s('prof-following', u.followingCount||0);
  s('prof-rizz', u.rizzPoints||0);
  s('pd-age', u.age ? u.age+' yrs' : null);
  s('pd-height', u.height ? u.height+' cm' : null);
  s('pd-dob', u.dob);
  s('pd-nature', u.nature);
  s('pd-course', u.course);
  s('pd-year', u.year);
  s('pd-music', u.music);

  var badges = [];
  if ((u.rizzPoints||0)>=500) badges.push({icon:'🔥',label:'High Rizz'});
  if ((u.followingCount||0)>=5) badges.push({icon:'🤝',label:'Social'});
  if ((u.postsCount||0)>=3) badges.push({icon:'📸',label:'Creator'});
  if (u.isVerified) badges.push({icon:'✅',label:'Verified'});
  badges.push({icon:'🎓',label:'GU-Rizz Member'});
  var badgesEl = document.getElementById('prof-badges');
  if (badgesEl) badgesEl.innerHTML = badges.map(function(b){return '<div class="profile-badge">'+b.icon+' '+b.label+'</div>';}).join('');

  var hl=[{e:'📸',l:'Campus'},{e:'🎓',l:'Study'},{e:'🎶',l:'Music'},{e:'🏃',l:'Sports'},{e:'🌙',l:'Night'}];
  var hlEl = document.getElementById('profile-highlights');
  if (hlEl) hlEl.innerHTML = hl.map(function(h){return '<div class="hl-item" onclick="window.showToast(\''+h.l+' highlights\',\'info\')"><div class="hl-ring"><div class="hl-inner">'+h.e+'</div></div><div class="hl-name">'+h.l+'</div></div>';}).join('');

  // Gifts received
  var recRow = document.getElementById('received-row');
  if (recRow) {
    window.API.Vibe.getReceivedGifts(u._id||u.id)
      .then(function(res) {
        var gifts = res.data.gifts||[];
        recRow.innerHTML = gifts.length
          ? gifts.map(function(g){return '<div class="received-item"><span class="received-emoji">'+(g.giftEmoji||'🎁')+'</span>'+g.giftName+'</div>';}).join('')
          : '<span style="font-size:13px;color:var(--text3);">No gifts yet 😅</span>';
      })
      .catch(function(){recRow.innerHTML='<span style="font-size:13px;color:var(--text3);">No gifts yet</span>';});
  }

  renderProfilePosts();
}

export function renderProfilePosts() {
  var grid = document.getElementById('profile-posts-grid'); if (!grid) return;
  var uid = S.user && (S.user._id || S.user.id);
  if (!uid) return;
  window.API.Posts.getUserPosts(uid, 1)
    .then(function(res) {
      var posts = res.data.posts||[];
      if (!posts.length) { grid.innerHTML=Array(6).fill(0).map(function(){return '<div class="profile-post-thumb" style="opacity:0.15;cursor:default;">📷</div>';}).join(''); return; }
      grid.innerHTML = posts.map(function(p){
        return '<div class="profile-post-thumb">' +
          (p.mediaURL&&!p.isVideo?'<img src="'+p.mediaURL+'" />':p.mediaURL&&p.isVideo?'<video src="'+p.mediaURL+'" muted></video>':(p.emoji||'📸')) +
          '<div class="thumb-overlay">❤️ '+(p.likesCount||0)+' &nbsp; 💬 '+((p.comments||[]).length)+'</div></div>';
      }).join('');
    })
    .catch(function(){grid.innerHTML=Array(6).fill(0).map(function(){return '<div class="profile-post-thumb" style="opacity:0.1;cursor:default;">📷</div>';}).join('');});
}

export function showAvatarOptions() { var el=document.getElementById('av-upload'); if(el) el.click(); }

export function handleAvatarUpload(input) {
  var file = input.files[0]; if (!file) return;
  showToast('Uploading...','info');
  window.API.Users.uploadAvatar(file)
    .then(function(res) {
      S.user.profileImageURL = res.data.profileImageURL;
      if (window.updateNavUI) window.updateNavUI();
      renderMiniProfile(); renderProfile();
      showToast('Profile photo updated! 📸','success');
    })
    .catch(function(err){showToast(err.message||'Upload failed','error');});
}
