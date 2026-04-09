import { S } from '../state.js';

var _timeInterval = null;

export function startTimeTracking() {
  _timeInterval = setInterval(function() {
    if (!S.user) return;
    window.API.Users.heartbeat(5)
      .then(function(res) {
        if (S.user) S.user.rizzPoints = res.data.rizzPoints;
        updateRizzDisplay();
      })
      .catch(function() {});
  }, 5 * 60 * 1000);
}

export function stopTimeTracking() {
  if (_timeInterval) clearInterval(_timeInterval);
}

export function addRizz(pts) {
  if (!S.user) return;
  S.user.rizzPoints = (S.user.rizzPoints || 0) + pts;
  updateRizzDisplay();
}

export function updateRizzDisplay() {
  var r = (S.user && S.user.rizzPoints) ? S.user.rizzPoints : 0;
  var ids = [['nav-rizz','⚡ '+r],['pm-rizz-val',r],['sidebar-rizz',r],['gifts-rizz-val',r],['prof-rizz',r],['my-rizz-val',r]];
  ids.forEach(function(pair) {
    var el = document.getElementById(pair[0]);
    if (el) el.textContent = pair[1];
  });
}
