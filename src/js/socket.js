// ── GU-Rizz Socket Client ────────────────────────────────
// Loaded via script tag, exposes window.SOCKET

window.SOCKET = {
  _socket: null,

  connect: function() {
    if (window.SOCKET._socket && window.SOCKET._socket.connected) return;
    var token = localStorage.getItem('gu_access_token');
    // socket.io-client is loaded via CDN script tag in index.html
    if (typeof io === 'undefined') { console.warn('socket.io not loaded'); return; }
    var socketUrl = (typeof __SOCKET_BASE__ !== 'undefined' ? __SOCKET_BASE__ : '/');
    window.SOCKET._socket = io(socketUrl, {   // ← no indentation, was clearly a bad paste
      auth: { token: token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      withCredentials: true,
    });
    window.SOCKET._socket.on('connect', function() { console.log('Socket connected'); });
    window.SOCKET._socket.on('disconnect', function(r) { console.warn('Socket disconnected:', r); });
    window.SOCKET._socket.on('connect_error', function(e) { console.warn('Socket error:', e.message); });
    window.SOCKET._bindGlobalEvents();
  },

  disconnect: function() {
    if (window.SOCKET._socket) { window.SOCKET._socket.disconnect(); window.SOCKET._socket = null; }
  },

  get: function() { return window.SOCKET._socket; },

  emit: function(event, data) {
    if (window.SOCKET._socket) window.SOCKET._socket.emit(event, data);
  },

  on: function(event, cb) {
    if (window.SOCKET._socket) window.SOCKET._socket.on(event, cb);
  },

  off: function(event) {
    if (window.SOCKET._socket) window.SOCKET._socket.off(event);
  },

  // Chat
  joinChat:      function(cid)           { window.SOCKET.emit('chat:join', cid); },
  leaveChat:     function(cid)           { window.SOCKET.emit('chat:leave', cid); },
  sendMessage:   function(cid, text, tid){ window.SOCKET.emit('chat:send', { chatId: cid, text: text, tempId: tid }); },
  sendTyping:    function(cid)           { window.SOCKET.emit('chat:typing', { chatId: cid }); },
  stopTyping:    function(cid)           { window.SOCKET.emit('chat:stop_typing', { chatId: cid }); },
  markRead:      function(cid)           { window.SOCKET.emit('chat:read', { chatId: cid }); },

  // Video Spark
  joinSparkQueue:  function()            { window.SOCKET.emit('spark:join_queue'); },
  leaveSparkQueue: function()            { window.SOCKET.emit('spark:leave_queue'); },
  sendOffer:       function(rid, offer)  { window.SOCKET.emit('spark:offer',         { roomId: rid, offer: offer }); },
  sendAnswer:      function(rid, answer) { window.SOCKET.emit('spark:answer',        { roomId: rid, answer: answer }); },
  sendIce:         function(rid, cand)   { window.SOCKET.emit('spark:ice_candidate', { roomId: rid, candidate: cand }); },
  nextSpark:       function(rid)         { window.SOCKET.emit('spark:next',          { roomId: rid }); },
  endSpark:        function(rid)         { window.SOCKET.emit('spark:end',           { roomId: rid }); },

  // Post watching
  watchPost:   function(pid) { window.SOCKET.emit('post:watch',   pid); },
  unwatchPost: function(pid) { window.SOCKET.emit('post:unwatch', pid); },

  // Bind global real-time events
  _bindGlobalEvents: function() {
    var s = window.SOCKET._socket;
    if (!s) return;

    // Real-time notification
    s.on('notification:new', function(notif) {
      if (!window.S) return;
      if (!window.S.notifications) window.S.notifications = [];
      window.S.notifications.unshift({
        id: notif._id, icon: notif.icon, bg: notif.bgColor,
        msg: notif.message, time: 'just now', unread: true,
      });
      if (window.renderNotifBadge) window.renderNotifBadge();
      if (window.renderNotifList)  window.renderNotifList();
    });

    // Rizz update
    s.on('rizz:update', function(data) {
      if (window.S && window.S.user) window.S.user.rizzPoints = data.rizzPoints;
      if (window.updateRizzDisplay) window.updateRizzDisplay();
    });

    // New post in feed
    s.on('feed:new_post', function(post) {
      if (window.S) { window.S.posts.unshift(Object.assign({}, post, { liked: false })); }
      if (window.renderFeed) window.renderFeed();
    });

    // Online/offline presence
    s.on('presence:online',  function(d) {
      var dot = document.getElementById('online-' + d.userId);
      if (dot) dot.style.display = 'block';
    });
    s.on('presence:offline', function(d) {
      var dot = document.getElementById('online-' + d.userId);
      if (dot) dot.style.display = 'none';
    });
  },
};

console.log('Socket client ready');
