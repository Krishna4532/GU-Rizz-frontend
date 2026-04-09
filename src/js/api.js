// ── GU-Rizz API Client ──────────────────────────────────
const BASE = (typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : '') + '/api';

async function http(method, endpoint, body, isFormData) {
  const opts = { method, credentials: 'include', headers: {} };
  const token = localStorage.getItem('gu_access_token');
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body) {
    if (isFormData) { opts.body = body; }
    else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  }
  const res  = await fetch(BASE + endpoint, opts);
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid response' }));
  if (res.status === 401 && endpoint !== '/auth/refresh-token') {
    const ok = await _refreshToken();
    if (ok) return http(method, endpoint, body, isFormData);
  }
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
}

async function _refreshToken() {
  try {
    const data = await http('POST', '/auth/refresh-token');
    if (data.data && data.data.accessToken) { localStorage.setItem('gu_access_token', data.data.accessToken); return true; }
  } catch (e) {}
  return false;
}

const _get    = function(ep)     { return http('GET',    ep); };
const _post   = function(ep, b)  { return http('POST',   ep, b); };
const _put    = function(ep, b)  { return http('PUT',    ep, b); };
const _del    = function(ep)     { return http('DELETE', ep); };
const _upload = function(ep, fd) { return http('POST',   ep, fd, true); };

window.API = {
  Auth: {
    signup:             function(b)      { return _post('/auth/signup', b); },
    login:              function(id, pw) { return _post('/auth/login', { identifier: id, password: pw }); },
    logout:             function()       { return _post('/auth/logout'); },
    me:                 function()       { return _get('/auth/me'); },
    completeVibeProfile:function(b)      { return _post('/auth/complete-vibe', b); },
    forgotPassword:     function(email)  { return _post('/auth/forgot-password', { email: email }); },
    storeToken:         function(t)      { localStorage.setItem('gu_access_token', t); },
    clearToken:         function()       { localStorage.removeItem('gu_access_token'); },
  },
  Users: {
    getProfile:    function(username) { return _get('/users/profile/' + username); },
    updateProfile: function(b)        { return _put('/users/profile', b); },
    uploadAvatar:  function(file)     { var fd = new FormData(); fd.append('avatar', file); return _upload('/users/avatar', fd); },
    follow:        function(uid)      { return _post('/users/follow/' + uid); },
    explore:       function(params)   { return _get('/users/explore?' + new URLSearchParams(params).toString()); },
    getSuggested:  function()         { return _get('/users/suggested'); },
    updateSettings:function(b)        { return _put('/users/settings', b); },
    block:         function(uid)      { return _post('/users/block/' + uid); },
    heartbeat:     function(mins)     { return _post('/users/heartbeat', { minutesSpent: mins }); },
  },
  Posts: {
    getFeed:     function(type, page) { return _get('/posts?type=' + (type||'recent') + '&page=' + (page||1)); },
    getUserPosts:function(uid, page)  { return _get('/posts/user/' + uid + '?page=' + (page||1)); },
    create:      function(caption, file) {
      var fd = new FormData();
      fd.append('caption', caption || '');
      if (file) fd.append('media', file);
      return _upload('/posts', fd);
    },
    delete:      function(id)       { return _del('/posts/' + id); },
    like:        function(id)       { return _post('/posts/' + id + '/like'); },
    comment:     function(id, text) { return _post('/posts/' + id + '/comment', { text: text }); },
    share:       function(id)       { return _post('/posts/' + id + '/share'); },
    report:      function(id, r)    { return _post('/posts/' + id + '/report', { reason: r }); },
  },
  Chat: {
    getInbox:    function()          { return _get('/chat/inbox'); },
    openWith:    function(uid)       { return _get('/chat/with/' + uid); },
    getMessages: function(cid, p)   { return _get('/chat/' + cid + '/messages?page=' + (p||1)); },
    send:        function(cid, text){ return _post('/chat/' + cid + '/messages', { text: text }); },
    sendMedia:   function(cid, file){ var fd = new FormData(); fd.append('media', file); return _upload('/chat/' + cid + '/messages/media', fd); },
    deleteMsg:   function(mid)      { return _del('/chat/messages/' + mid); },
  },
  Vibe: {
    getConfessions:    function(p)         { return _get('/vibe/confessions?page=' + (p||1)); },
    createConfession:  function(text)      { return _post('/vibe/confessions', { text: text }); },
    likeConfession:    function(id)        { return _post('/vibe/confessions/' + id + '/like'); },
    commentConfession: function(id, text)  { return _post('/vibe/confessions/' + id + '/comment', { text: text }); },
    shareConfession:   function(id)        { return _post('/vibe/confessions/' + id + '/share'); },
    deleteConfession:  function(id)        { return _del('/vibe/confessions/' + id); },
    getGiftCatalog:    function()          { return _get('/vibe/gifts'); },
    sendGift:          function(rid, gid, msg) { return _post('/vibe/gifts/send', { recipientId: rid, giftId: gid, message: msg||'' }); },
    getReceivedGifts:  function(uid)       { return _get('/vibe/gifts/received/' + uid); },
    getLeaderboard:    function(period)    { return _get('/vibe/leaderboard?period=' + (period||'alltime')); },
  },
  Notifications: {
    get:      function(p)    { return _get('/notifications?page=' + (p||1)); },
    markRead: function(ids)  { return _post('/notifications/read', ids ? { ids: ids } : {}); },
  },
};

console.log('API client ready');
