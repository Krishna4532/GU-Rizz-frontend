import { S } from '../state.js';
import { initials, showToast } from '../helpers.js';

export function vibeTab(tab, btn) {
  document.querySelectorAll('.vtab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.vcontent').forEach(function(c){c.classList.remove('active');});
  btn.classList.add('active');
  document.getElementById('vc-'+tab).classList.add('active');
  if (tab==='leaderboard') renderLeaderboard();
  if (tab==='gifts')       renderGifts();
  if (tab==='confess')     renderConfessions();
}

export function initConfessions() { if (!S.confessions || !S.confessions.length) renderConfessions(); }

export function renderConfessions() {
  var list = document.getElementById('confessions-list');
  if (!list) return;
  list.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text3);">Loading...</div>';
  window.API.Vibe.getConfessions(1)
    .then(function(res) { S.confessions = res.data.confessions || []; _drawConfessions(); })
    .catch(function() { S.confessions = []; _drawConfessions(); });
}

function _drawConfessions() {
  var list = document.getElementById('confessions-list');
  if (!list) return;
  if (!S.confessions.length) { list.innerHTML='<div style="text-align:center;padding:2rem;color:var(--text3);">No confessions yet. Be the first 🤫</div>'; return; }
  list.innerHTML = S.confessions.map(function(c, i) {
    return '<div class="conf-card"><div class="conf-num">#'+(i+1)+'</div>' +
      '<div class="conf-text">"'+c.text+'"</div>' +
      '<div style="margin-bottom:8px;">' + ((c.comments||[]).map(function(cm) {
        return '<div class="comment-item" style="margin-bottom:4px;"><div class="comment-av" style="background:var(--bg5);font-size:11px;">👤</div>' +
          '<div class="comment-bubble"><span class="comment-who" style="color:var(--text3);">Anon</span>'+(cm.text||cm.t||'')+'</div></div>';
      }).join('')) + '</div>' +
      '<div class="conf-actions">' +
      '<button class="conf-action '+(c.liked?'liked':'')+'" onclick="window.likeConf(\''+c._id+'\')"><svg viewBox="0 0 24 24" fill="'+(c.liked?'currentColor':'none')+'" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'+(c.likesCount||0)+'</button>' +
      '<button class="conf-action" onclick="window.commentConf(\''+c._id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>'+((c.comments||[]).length)+' Comments</button>' +
      '<button class="conf-action" onclick="window.shareConf(\''+c._id+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share</button>' +
      '</div></div>';
  }).join('');
}

export function postConfession() {
  var text = document.getElementById('conf-textarea') && document.getElementById('conf-textarea').value.trim();
  if (!text) { showToast('Write something first!','error'); return; }
  window.API.Vibe.createConfession(text)
    .then(function(res) {
      S.confessions.unshift(res.data.confession);
      document.getElementById('conf-textarea').value='';
      _drawConfessions();
      showToast('Confession posted anonymously 🤫','success');
    })
    .catch(function(err) { showToast(err.message,'error'); });
}

export function likeConf(id) {
  window.API.Vibe.likeConfession(id)
    .then(function(res) {
      var c = S.confessions.find(function(x){return x._id===id;});
      if (c) { c.liked=res.data.liked; c.likesCount=res.data.likesCount; }
      if (res.data.liked && window.addRizz) { window.addRizz(2); showToast('❤️ +2 Rizz!','info'); }
      _drawConfessions();
    })
    .catch(function(err) { showToast(err.message,'error'); });
}

export function commentConf(id) {
  var text = prompt('Add anonymous comment:');
  if (!text || !text.trim()) return;
  window.API.Vibe.commentConfession(id, text.trim())
    .then(function(res) {
      var c = S.confessions.find(function(x){return x._id===id;});
      if (c) { if(!c.comments) c.comments=[]; c.comments.push(res.data.comment); }
      if (window.addRizz) window.addRizz(5);
      showToast('💬 +5 Rizz!','info');
      _drawConfessions();
    })
    .catch(function(err) { showToast(err.message,'error'); });
}

export function shareConf(id) {
  window.API.Vibe.shareConfession(id)
    .then(function() { if(window.addRizz) window.addRizz(10); showToast('🔁 +10 Rizz!','success'); })
    .catch(function(err) { showToast(err.message,'error'); });
}

export function renderLeaderboard() {
  window.API.Vibe.getLeaderboard('alltime')
    .then(function(res) {
      var board = res.data.leaderboard || [];
      var myRank = res.data.myRank;
      var maxPts = (board[0] && board[0].rizzPoints) ? board[0].rizzPoints : 1;
      var top3   = board.slice(0,3);
      var order  = [top3[1],top3[0],top3[2]].filter(Boolean);
      var medals = ['🥈','🥇','🥉']; var ringCls = ['silver','gold','bronze']; var podiumCls = ['second','first','third'];
      var top3El = document.getElementById('lb-top3');
      if (top3El) top3El.innerHTML = order.map(function(u,i) {
        var img = u.profileImageURL;
        var av  = img ? '<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />' : initials(u.name);
        return '<div class="lb-podium">' +
          (i===1?'<div class="lb-crown">👑</div>':'<div class="lb-medal">'+medals[i]+'</div>') +
          '<div class="lb-podium-av '+ringCls[i]+'" style="background:'+(u.color||'#888')+'">'+av+'</div>' +
          '<div class="lb-podium-name">'+u.name.split(' ')[0]+(u.isMe?' (You)':'')+'</div>' +
          '<div class="lb-podium-pts">⚡ '+(u.rizzPoints||0).toLocaleString()+'</div>' +
          '<div class="lb-podium-base '+podiumCls[i]+'">'+medals[i]+'</div></div>';
      }).join('');
      var listEl = document.getElementById('lb-list');
      if (listEl) listEl.innerHTML = board.map(function(u,i) {
        var img = u.profileImageURL;
        var av  = img ? '<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />' : initials(u.name);
        var pct = Math.round(((u.rizzPoints||0)/maxPts)*100);
        return '<div class="lb-row '+(u.isMe?'me':'')+'">' +
          '<div class="lb-rank">#'+(i+1)+'</div>' +
          '<div class="lb-row-av" style="background:'+(u.color||'#888')+'">'+av+'</div>' +
          '<div class="lb-row-info"><div class="lb-row-name">'+u.name+(u.isMe?' <span style="font-size:11px;color:var(--cr2);">(You)</span>':'')+'</div>' +
          '<div class="lb-row-sub">'+(u.course||'')+'</div>' +
          '<div class="lb-row-bar"><div class="lb-row-bar-fill" style="width:'+pct+'%"></div></div></div>' +
          '<div class="lb-pts">'+(u.rizzPoints||0).toLocaleString()+' <span>pts</span></div></div>';
      }).join('');
    })
    .catch(function() {});
}

export function renderGifts() {
  var el = document.getElementById('gifts-grid');
  if (!el) return;
  window.API.Vibe.getGiftCatalog()
    .then(function(res) {
      var gifts  = res.data.gifts || [];
      var myRizz = res.data.myRizzPoints || (S.user && S.user.rizzPoints) || 0;
      var valEl  = document.getElementById('gifts-rizz-val'); if(valEl) valEl.textContent = myRizz;
      el.innerHTML = gifts.map(function(g) {
        return '<div class="gift-card">' +
          '<div class="gift-emoji">'+g.emoji+'</div>' +
          '<div class="gift-name">'+g.name+'</div>' +
          '<div class="gift-cost">⚡ '+g.cost+' pts</div>' +
          '<button class="buy-btn" '+(g.canAfford?'':'disabled')+' onclick="window.openGiftModal(\''+g.id+'\',\''+g.emoji+'\',\''+g.name+'\','+g.cost+')">' +
          (g.canAfford ? 'Send Gift 💝' : 'Need more Rizz') + '</button></div>';
      }).join('');
    })
    .catch(function() {});
}

export function openGiftModal(giftId, emoji, name, cost) {
  S.pendingGift = { id: giftId, emoji: emoji, name: name, cost: cost };
  document.getElementById('gift-modal-title').textContent = 'Send '+emoji+' '+name;
  var sel = document.getElementById('gift-recipient');
  sel.innerHTML = '';
  (S.suggestedUsers || []).forEach(function(u) {
    var opt = document.createElement('option'); opt.value=u._id; opt.textContent=u.name+' (@'+u.username+')'; sel.appendChild(opt);
  });
  if (window.openModal) window.openModal('gift-modal');
}

export function confirmGift() {
  var gift   = S.pendingGift;
  var recipId= document.getElementById('gift-recipient') && document.getElementById('gift-recipient').value;
  if (!gift||!recipId) { if(window.closeModal) window.closeModal('gift-modal'); return; }
  window.API.Vibe.sendGift(recipId, gift.id)
    .then(function(res) {
      if (S.user) S.user.rizzPoints = res.data.newRizzPoints;
      if (window.updateRizzDisplay) window.updateRizzDisplay();
      if (window.closeModal) window.closeModal('gift-modal');
      renderGifts();
      showToast(gift.emoji+' '+gift.name+' sent! 💝','success');
    })
    .catch(function(err) { showToast(err.message,'error'); });
}
