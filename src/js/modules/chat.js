import { S } from '../state.js';
import { initials, showToast } from '../helpers.js';

export function renderChatList() {
  var list = document.getElementById('chat-list-items'); if (!list) return;
  window.API.Chat.getInbox()
    .then(function(res) { S.chatInbox = res.data.chats||[]; _drawChatList(); })
    .catch(function() { S.chatInbox=[]; _drawChatList(); });
}

function _drawChatList() {
  var list = document.getElementById('chat-list-items'); if (!list) return;
  if (!S.chatInbox||!S.chatInbox.length) { list.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text3);font-size:13px;">No messages yet.<br>Explore people and start chatting! 💬</div>'; return; }
  list.innerHTML = S.chatInbox.map(function(c) {
    var other = c.other||{};
    var diff  = c.updatedAt ? Date.now()-new Date(c.updatedAt).getTime() : 0;
    var t     = diff<60000?'now':diff<3600000?Math.floor(diff/60000)+'m':Math.floor(diff/3600000)+'h';
    return '<div class="chat-row '+(S.activeChat===c._id?'active':'')+'" id="cr-'+c._id+'" onclick="window.openChat(\''+c._id+'\',\''+(other._id||'')+'\')">'+
      '<div class="chat-av" style="background:'+(other.color||'#888')+';position:relative;">'+
        (other.profileImageURL?'<img src="'+other.profileImageURL+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />':initials(other.name||'?'))+
        '<div class="online-dot" id="online-'+(other._id||'')+'" style="display:none;"></div>'+
      '</div>'+
      '<div class="chat-row-info"><div class="chat-row-name">'+(other.name||'User')+'</div><div class="chat-row-preview">'+(c.lastMessage||'Start a conversation')+'</div></div>'+
      '<div class="chat-row-meta"><div class="chat-row-time">'+t+'</div>'+(c.unread>0?'<div class="unread-badge">'+c.unread+'</div>':'')+
      '</div></div>';
  }).join('');
}

export function filterChatList(q) {
  document.querySelectorAll('.chat-row').forEach(function(el) {
    var name = (el.querySelector('.chat-row-name')||{}).textContent||'';
    el.style.display = name.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

export function openChat(chatId, userId) {
  if (!chatId && userId) {
    window.API.Chat.openWith(userId)
      .then(function(res) { openChat(res.data.chat._id, null); })
      .catch(function(err) { showToast(err.message,'error'); });
    return;
  }
  S.activeChat = chatId;
  document.querySelectorAll('.chat-row').forEach(function(r){r.classList.remove('active');});
  var row = document.getElementById('cr-'+chatId); if(row) row.classList.add('active');
  var chatEntry = (S.chatInbox||[]).find(function(c){return c._id===chatId;});
  var other     = (chatEntry && chatEntry.other) || {};
  var win       = document.getElementById('chat-window'); if (!win) return;

  win.innerHTML = '<div class="chat-win">'+
    '<div class="chat-win-head">'+
      '<div class="chat-win-av" style="background:'+(other.color||'#888')+'">'+(other.profileImageURL?'<img src="'+other.profileImageURL+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />':initials(other.name||'?'))+'</div>'+
      '<div><div class="chat-win-name">'+(other.name||'User')+'</div><div class="chat-win-status" id="cstat-'+chatId+'">Online</div></div>'+
      '<div class="chat-win-actions"><div class="icon-btn" onclick="window.showToast(\'Voice notes coming soon!\',\'info\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div></div>'+
    '</div>'+
    '<div class="chat-msgs" id="chat-msgs-'+chatId+'"><div style="text-align:center;padding:1rem;color:var(--text3);font-size:13px;">Loading messages...</div></div>'+
    '<div id="typing-ind-'+chatId+'" style="padding:4px 14px;font-size:12px;color:var(--text3);display:none;">Typing...</div>'+
    '<div class="chat-inp-bar">'+
      '<label class="icon-btn" for="chat-media-'+chatId+'" title="Send image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></label>'+
      '<input type="file" id="chat-media-'+chatId+'" accept="image/*,video/*,audio/*" style="display:none" onchange="window.sendChatMedia(\''+chatId+'\',this)" />'+
      '<input class="chat-inp" id="ci-'+chatId+'" placeholder="Message '+(other.name||'User').split(' ')[0]+'..." '+
        'oninput="window.handleTyping(\''+chatId+'\')" '+
        'onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();window.sendMsg(\''+chatId+'\')}" />'+
      '<button class="send-btn" onclick="window.sendMsg(\''+chatId+'\')"><svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>'+
    '</div></div>';

  window.API.Chat.getMessages(chatId, 1)
    .then(function(res) { _renderMessages(chatId, res.data.messages||[], other); })
    .catch(function()   { _renderMessages(chatId, [], other); });

  // Bind socket events for this chat
  if (window.SOCKET) {
    var sock = window.SOCKET;
    sock.off('chat:message'); sock.off('chat:typing'); sock.off('chat:stop_typing');
    sock.on('chat:message', function(msg) {
      if (String(msg.chatId) !== String(chatId)) return;
      _appendMessage(chatId, msg, other);
      sock.markRead(chatId);
    });
    sock.on('chat:typing', function(d) {
      if (d.chatId!==chatId) return;
      var el=document.getElementById('typing-ind-'+chatId); if(el) el.style.display='block';
    });
    sock.on('chat:stop_typing', function(d) {
      if (d.chatId!==chatId) return;
      var el=document.getElementById('typing-ind-'+chatId); if(el) el.style.display='none';
    });
    sock.joinChat(chatId);
    sock.markRead(chatId);
  }
}

function _renderMessages(chatId, messages, other) {
  var msgsEl = document.getElementById('chat-msgs-'+chatId); if (!msgsEl) return;
  var me = S.user;
  msgsEl.innerHTML = messages.map(function(m) {
    var isMe  = String(m.senderId && (m.senderId._id||m.senderId)) === String(me._id||me.id);
    var color = isMe ? (me.color||'#c0132a') : (other.color||'#888');
    var img   = isMe ? me.profileImageURL : other.profileImageURL;
    var avHtml= img ? '<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />' : initials(isMe?me.name:(other.name||'?'));
    var content = m.mediaURL ? (m.mediaType==='image'?'<img src="'+m.mediaURL+'" style="max-width:220px;border-radius:10px;display:block;" />':'<audio src="'+m.mediaURL+'" controls style="max-width:220px;"></audio>') : (m.text||'');
    return '<div class="msg '+(isMe?'sent':'received')+'"><div class="msg-av" style="background:'+(img?'transparent':color)+'">'+avHtml+'</div>'+
      '<div><div class="msg-bub">'+content+'</div><div style="font-size:10px;color:var(--text3);padding:2px 4px;">'+new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div></div>';
  }).join('');
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function _appendMessage(chatId, msg, other) {
  var msgsEl = document.getElementById('chat-msgs-'+chatId); if (!msgsEl) return;
  var me  = S.user;
  var isMe= String(msg.senderId&&(msg.senderId._id||msg.senderId))===String(me._id||me.id);
  var color=(isMe?me.color:(other&&other.color))||'#888';
  var img  = isMe ? me.profileImageURL : (other&&other.profileImageURL);
  var avHtml=img?'<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />':initials(isMe?me.name:((other&&other.name)||'?'));
  msgsEl.insertAdjacentHTML('beforeend','<div class="msg '+(isMe?'sent':'received')+'"><div class="msg-av" style="background:'+(img?'transparent':color)+'">'+avHtml+'</div><div><div class="msg-bub">'+(msg.text||'')+'</div></div></div>');
  msgsEl.scrollTop=msgsEl.scrollHeight;
}

var _typingTimer = null;
export function sendMsg(chatId) {
  var inp = document.getElementById('ci-'+chatId);
  var text= inp && inp.value.trim(); if (!text) return;
  var other=(S.chatInbox||[]).find(function(c){return c._id===chatId;});
  _appendMessage(chatId, { senderId: S.user._id||S.user.id, text: text, createdAt: new Date() }, other&&other.other);
  if (inp) inp.value='';
  if (window.SOCKET) { window.SOCKET.sendMessage(chatId, text, 'tmp-'+Date.now()); }
  else { window.API.Chat.send(chatId, text).catch(function(){}); }
}

export function handleTyping(chatId) {
  if (window.SOCKET) window.SOCKET.sendTyping(chatId);
  clearTimeout(_typingTimer);
  _typingTimer=setTimeout(function(){if(window.SOCKET)window.SOCKET.stopTyping(chatId);},2000);
}

export function sendChatMedia(chatId, input) {
  var file=input.files[0]; if(!file) return;
  showToast('Sending...','info');
  window.API.Chat.sendMedia(chatId, file)
    .then(function(){showToast('Media sent!','success');input.value='';})
    .catch(function(err){showToast(err.message,'error');});
}
