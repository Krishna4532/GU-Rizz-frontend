import { S } from '../state.js';
import { showToast } from '../helpers.js';

var peerConnection = null;
var localStream    = null;
var currentRoomId  = null;
var ICE_SERVERS    = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

export function renderWaitingChips() {
  var el = document.getElementById('waiting-chips'); if (!el) return;
  el.innerHTML = '<div style="font-size:13px;color:var(--text3);">Waiting for live users...</div>';
}

export function updateLiveCount() {
  if (window.SOCKET) {
    window.SOCKET.emit('spark:get_online_count');
    var s = window.SOCKET.get();
    if (s) s.once('spark:online_count', function(d) {
      var el=document.getElementById('live-count'); if(el) el.textContent=d.count+' students online now';
    });
  } else {
    var el=document.getElementById('live-count');
    if(el) el.textContent=(Math.floor(Math.random()*90)+40)+' students online now';
  }
}

export async function startVideo() {
  document.getElementById('video-standby').style.display='none';
  var va=document.getElementById('video-active'); va.style.display='flex'; va.classList.add('fullscreen-video');
  _startHearts();
  var me=S.user;
  document.getElementById('my-emoji').style.display='none';
  var myVid=document.getElementById('my-live-vid'); myVid.style.display='block';
  try {
    localStream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    myVid.srcObject=localStream; S.myVideoStream=localStream;
  } catch(e) {
    showToast('Camera access denied','error');
    document.getElementById('my-emoji').style.display=''; myVid.style.display='none';
  }
  var vfUser=document.getElementById('my-vf-user');
  if(vfUser) vfUser.innerHTML='<div style="font-size:13px;font-weight:600;">'+me.name+'</div><div style="font-size:11px;color:rgba(255,255,255,0.6);">'+(me.course||'GU-Rizz')+'</div>';
  _bindSparkEvents();
  if (window.SOCKET) window.SOCKET.joinSparkQueue();
  var se=document.getElementById('stranger-emoji'); if(se){se.style.display='';se.textContent='🔍';}
  document.getElementById('stranger-vf-user').innerHTML='<div style="font-size:13px;color:rgba(255,255,255,0.5);">Searching for a stranger...</div>';
}

function _bindSparkEvents() {
  if (!window.SOCKET) return;
  var s=window.SOCKET.get(); if (!s) return;
  s.off('spark:matched'); s.off('spark:waiting'); s.off('spark:offer'); s.off('spark:answer'); s.off('spark:ice_candidate'); s.off('spark:partner_left'); s.off('spark:ended');
  s.on('spark:waiting', function(d){ showToast('⏳ Searching... '+d.queueLength+' in queue','info'); });
  s.on('spark:matched', async function(d) {
    currentRoomId=d.roomId;
    showToast('Connected with '+((d.partnerInfo&&d.partnerInfo.name)||'Stranger').split(' ')[0]+'! Say hi 👋','success');
    _updateStrangerUI(d.partnerInfo||{});
    _startCallTimer();
    await _createPeer(d.roomId, d.isInitiator);
  });
  s.on('spark:offer', async function(d) {
    if (!peerConnection) await _createPeer(currentRoomId, false);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(d.offer));
    var answer=await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    if(window.SOCKET) window.SOCKET.sendAnswer(currentRoomId, answer);
  });
  s.on('spark:answer', async function(d) {
    if(peerConnection) await peerConnection.setRemoteDescription(new RTCSessionDescription(d.answer));
  });
  s.on('spark:ice_candidate', async function(d) {
    if(peerConnection&&d.candidate) await peerConnection.addIceCandidate(new RTCIceCandidate(d.candidate)).catch(function(){});
  });
  s.on('spark:partner_left', function() { showToast('Stranger disconnected','info'); _cleanupPeer(); if(window.SOCKET) window.SOCKET.joinSparkQueue(); });
  s.on('spark:ended', function() { endVideo(); });
}

async function _createPeer(roomId, isInitiator) {
  _cleanupPeer();
  peerConnection=new RTCPeerConnection({iceServers:ICE_SERVERS});
  if(localStream) localStream.getTracks().forEach(function(t){peerConnection.addTrack(t,localStream);});
  peerConnection.ontrack=function(e) {
    var sv=document.getElementById('stranger-live-vid');
    if(sv){sv.srcObject=e.streams[0];sv.style.display='block'; var se=document.getElementById('stranger-emoji'); if(se)se.style.display='none';}
  };
  peerConnection.onicecandidate=function(e){ if(e.candidate&&window.SOCKET) window.SOCKET.sendIce(roomId,e.candidate); };
  peerConnection.oniceconnectionstatechange=function(){
    if(['failed','disconnected','closed'].includes(peerConnection&&peerConnection.iceConnectionState)){
      _cleanupPeer(); setTimeout(function(){if(window.SOCKET)window.SOCKET.joinSparkQueue();},1000);
    }
  };
  if(isInitiator) {
    var offer=await peerConnection.createOffer({offerToReceiveVideo:true,offerToReceiveAudio:true});
    await peerConnection.setLocalDescription(offer);
    if(window.SOCKET) window.SOCKET.sendOffer(roomId,offer);
  }
}

function _cleanupPeer() {
  if(peerConnection){peerConnection.close();peerConnection=null;}
  var sv=document.getElementById('stranger-live-vid'); if(sv){sv.srcObject=null;sv.style.display='none';}
  var se=document.getElementById('stranger-emoji'); if(se){se.style.display='';se.textContent='🔍';}
  _stopCallTimer();
}

function _updateStrangerUI(p) {
  var se=document.getElementById('stranger-emoji'); if(se)se.style.display='none';
  document.getElementById('stranger-vf-user').innerHTML='<div style="font-size:13px;font-weight:600;">'+(p.name||'Stranger')+'</div><div style="font-size:11px;color:rgba(255,255,255,0.6);">'+(p.course||'GU-Rizz')+'</div>';
}

export function nextStranger() {
  if(currentRoomId&&window.SOCKET) window.SOCKET.nextSpark(currentRoomId);
  _cleanupPeer();
  showToast('Finding next stranger...','info');
  document.getElementById('stranger-vf-user').innerHTML='<div style="font-size:13px;color:rgba(255,255,255,0.5);">Searching...</div>';
}

export function endVideo() {
  if(currentRoomId&&window.SOCKET) window.SOCKET.endSpark(currentRoomId);
  if(window.SOCKET) window.SOCKET.leaveSparkQueue();
  _cleanupPeer();
  if(S.myVideoStream){S.myVideoStream.getTracks().forEach(function(t){t.stop();});S.myVideoStream=null;}
  localStream=null; currentRoomId=null;
  _stopHearts(); _stopCallTimer();
  document.getElementById('video-standby').style.display='';
  var va=document.getElementById('video-active'); va.style.display='none'; va.classList.remove('fullscreen-video');
  updateLiveCount();
  showToast('Call ended. Thanks for sparking! ⚡','info');
}

export function toggleMic() { var b=document.getElementById('mic-btn'); if(!b)return; var m=b.textContent==='🔇'; if(localStream)localStream.getAudioTracks().forEach(function(t){t.enabled=m;}); b.textContent=m?'🎤':'🔇'; }
export function toggleCam() { var b=document.getElementById('cam-btn'); if(!b)return; var h=b.textContent==='🙈'; if(localStream)localStream.getVideoTracks().forEach(function(t){t.enabled=h;}); b.textContent=h?'📷':'🙈'; }

function _startHearts() {
  var hc=document.getElementById('hearts-container'); if(!hc)return; hc.style.display='block';
  S.heartsInt=setInterval(function(){
    var h=document.createElement('div'); h.className='falling-heart';
    h.textContent=['❤️','💖','💕','⚡'][Math.floor(Math.random()*4)];
    h.style.left=Math.random()*100+'vw'; h.style.animationDuration=(Math.random()*3+3)+'s';
    hc.appendChild(h); setTimeout(function(){h.remove();},6000);
  },800);
}
function _stopHearts() { if(S.heartsInt){clearInterval(S.heartsInt);S.heartsInt=null;} var hc=document.getElementById('hearts-container'); if(hc){hc.innerHTML='';hc.style.display='none';} }
function _startCallTimer() {
  S.callSecs=0; if(S.callTimer)clearInterval(S.callTimer);
  S.callTimer=setInterval(function(){ S.callSecs++; var m=Math.floor(S.callSecs/60),sc=S.callSecs%60; var el=document.getElementById('call-timer'); if(el)el.textContent='Connected: '+(m?m+'m ':'')+sc+'s'; },1000);
}
function _stopCallTimer() { if(S.callTimer){clearInterval(S.callTimer);S.callTimer=null;} }
