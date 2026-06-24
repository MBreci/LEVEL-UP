/* ===== LEVEL UP — MVP ===== */

const RANKS = [
  { name: 'ROOKIE',   min: 0 },
  { name: 'NOVA',     min: 1000 },
  { name: 'VANGUARD', min: 3000 },
  { name: 'PRIME',    min: 7000 },
  { name: 'RIVAL',    min: 15000 },
  { name: 'ELITE',    min: 30000 },
  { name: 'APEX',     min: 60000 },
  { name: 'LEGACY',   min: 120000 },
];

const FUNCTIONAL_MODULES = [
  { id: 'carta', label: 'MI CARTA' },
  { id: 'historial', label: 'HISTORIAL' },
  { id: 'ranking', label: 'RANKING' },
  { id: 'notificaciones', label: 'NOTIFICACIONES' },
];

const WIP_MODULES = [
  { name: 'LOGROS', icon: '🏆' },
  { name: 'EQUIPO DE LA SEMANA', icon: '⭐' },
  { name: 'RANKING POR POSICIÓN', icon: '📊' },
  { name: 'RANKING ENTRE AMIGOS', icon: '🤝' },
  { name: 'PERFIL PÚBLICO', icon: '🌐' },
  { name: 'ESTADIOS LEVEL UP', icon: '🏟️' },
  { name: 'VALOR DE MERCADO', icon: '💹' },
  { name: 'LEVEL COINS', icon: '🪙' },
  { name: 'CLUBES', icon: '🛡️' },
  { name: 'FICHAJES', icon: '🔄' },
  { name: 'TEMPORADAS', icon: '📅' },
  { name: 'HALL OF FAME', icon: '🗿' },
  { name: 'MARKETPLACE', icon: '🛒' },
  { name: 'PATROCINIOS', icon: '🤝' },
  { name: 'FANTASY LEAGUE', icon: '🎮' },
  { name: 'TORNEOS PRIVADOS', icon: '🏆' },
  { name: 'COMERCIO ENTRE EQUIPOS', icon: '🔁' },
  { name: 'IA SCOUTING', icon: '🤖' },
];

const PROFILES_KEY = 'levelup_profiles';
const CURRENT_KEY = 'levelup_current_profile';

function makeProfile({ name, position, team, photo }) {
  return {
    id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: name.toUpperCase(),
    position,
    team: team || 'SIN EQUIPO',
    photo: photo || 'assets/player-photo.png',
    ovr: 60,
    xp: 0,
    matches: 0,
    goals: 0,
    assists: 0,
    mvps: 0,
    attrs: { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, fis: 60 },
    history: [],
    notifications: [
      { icon: '👋', text: 'Bienvenido a LEVEL UP. Juega tu primer partido para activar tu carta.', time: 'AHORA' },
    ],
  };
}

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || {}; } catch { return {}; }
}

function saveProfiles() {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

let profiles = loadProfiles();
let state = null;

function setCurrentProfile(id) {
  localStorage.setItem(CURRENT_KEY, id);
  state = profiles[id];
}

function saveState() {
  profiles[state.id] = state;
  saveProfiles();
}

function loadCurrentProfile() {
  const id = localStorage.getItem(CURRENT_KEY);
  if (id && profiles[id]) {
    state = profiles[id];
    return true;
  }
  return false;
}

function getRank(xp) {
  let current = RANKS[0];
  for (const r of RANKS) if (xp >= r.min) current = r;
  return current;
}

function getNextRank(xp) {
  return RANKS.find(r => r.min > xp) || null;
}

function renderNav() {
  const nav = document.getElementById('nav-modules');
  nav.innerHTML = '';
  FUNCTIONAL_MODULES.forEach(m => {
    const el = document.createElement('div');
    el.className = 'nm-item';
    el.textContent = m.label;
    el.onclick = () => goTo(m.id);
    nav.appendChild(el);
  });
  WIP_MODULES.slice(0, 6).forEach(m => {
    const el = document.createElement('div');
    el.className = 'nm-item';
    el.innerHTML = `${m.name} <span class="nm-lock">🔒</span>`;
    el.onclick = () => openWip(m.name);
    nav.appendChild(el);
  });
}

function renderHero() {
  const rank = getRank(state.xp);
  document.getElementById('hero-stats').innerHTML = `
    <div class="h-stat"><div class="h-stat-n">${state.ovr}</div><div class="h-stat-l">OVR</div></div>
    <div class="h-stat"><div class="h-stat-n">${rank.name}</div><div class="h-stat-l">RANGO</div></div>
    <div class="h-stat"><div class="h-stat-n">${state.matches}</div><div class="h-stat-l">PARTIDOS</div></div>
    <div class="h-stat"><div class="h-stat-n">${state.xp}</div><div class="h-stat-l">XP</div></div>
  `;
}

function renderCard() {
  const rank = getRank(state.xp);
  const a = state.attrs;
  document.getElementById('fifa-card').innerHTML = `
    <div class="fc-head">
      <div><div class="fc-ovr">${state.ovr}</div><div class="fc-pos">${state.position}</div></div>
      <div class="fc-rank">${rank.name}</div>
    </div>
    <div class="fc-player">${state.photo ? `<img class="fc-photo-img" src="${state.photo}">` : `<div class="fc-photo-placeholder">📷</div>`}</div>
    <div class="fc-namebar"><div class="fc-name">${state.name}</div></div>
    <div class="fc-attrs">
      <div class="fca"><div class="fca-v">${a.pac}</div><div class="fca-l">PAC</div></div>
      <div class="fca"><div class="fca-v">${a.sho}</div><div class="fca-l">SHO</div></div>
      <div class="fca"><div class="fca-v">${a.pas}</div><div class="fca-l">PAS</div></div>
      <div class="fca"><div class="fca-v">${a.dri}</div><div class="fca-l">DRI</div></div>
      <div class="fca"><div class="fca-v">${a.def}</div><div class="fca-l">DEF</div></div>
      <div class="fca"><div class="fca-v">${a.fis}</div><div class="fca-l">FIS</div></div>
    </div>
    <div class="fc-foot"><div class="fc-team">${state.team}</div></div>
  `;

  const next = getNextRank(state.xp);
  const prevMin = rank.min;
  const nextMin = next ? next.min : prevMin + 1;
  const pct = next ? Math.min(100, Math.round(((state.xp - prevMin) / (nextMin - prevMin)) * 100)) : 100;
  const rankPos = getGeneralRanking().findIndex(p => p.id === 'me') + 1;

  document.getElementById('player-info').innerHTML = `
    <div class="pi-name">${state.name}</div>
    <div class="pi-sub">${state.position} · ${state.team}</div>
    <div class="pi-tags">
      <div class="pi-tag g">RANGO: ${rank.name}</div>
      <div class="pi-tag gold">RANKING GENERAL #${rankPos}</div>
    </div>
    <div class="pi-stats">
      <div class="pi-stat"><div class="pi-stat-n">${state.matches}</div><div class="pi-stat-l">PARTIDOS</div></div>
      <div class="pi-stat"><div class="pi-stat-n">${state.goals}</div><div class="pi-stat-l">GOLES</div></div>
      <div class="pi-stat"><div class="pi-stat-n">${state.assists}</div><div class="pi-stat-l">ASISTENCIAS</div></div>
      <div class="pi-stat"><div class="pi-stat-n">${state.mvps}</div><div class="pi-stat-l">MVP</div></div>
    </div>
    <div class="bars">
      <div class="bar">
        <div class="bar-top"><span class="bar-l">OVERALL (OVR)</span><span class="bar-n">${state.ovr}/100</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${state.ovr}%"></div></div>
      </div>
    </div>
    <div class="lvl-wrap">
      <div class="lvl-top">
        <div class="lvl-badge">${rank.name}</div>
        <div class="lvl-xp">${state.xp} XP ${next ? '· ' + (nextMin - state.xp) + ' XP PARA ' + next.name : '· RANGO MÁXIMO'}</div>
      </div>
      <div class="lvl-track"><div class="lvl-fill" style="width:${pct}%"></div></div>
    </div>
  `;
}

function renderHistory() {
  const el = document.getElementById('hist-list');
  if (!state.history.length) {
    el.innerHTML = `<div class="notif-empty">Aún no tienes partidos. Pulsa "JUGAR PARTIDO" para crear tu primer historial.</div>`;
    return;
  }
  el.innerHTML = state.history.slice().reverse().map(h => `
    <div class="hist-row">
      <div class="hist-date">${h.date}</div>
      <div class="hist-result">${h.result}</div>
      <div class="hist-mvp ${h.mvp ? 'yes' : 'no'}">${h.mvp ? '★ MVP' : '—'}</div>
      <div class="hist-ovr ${h.ovrDelta >= 0 ? 'up' : 'down'}">${h.ovrDelta >= 0 ? '+' : ''}${h.ovrDelta} OVR</div>
    </div>
  `).join('');
}

const MOCK_PLAYERS = [
  { id: 'p1', name: 'SANTIAGO ROJAS', ovr: 88 },
  { id: 'p2', name: 'MATEO CASTRO', ovr: 84 },
  { id: 'p3', name: 'JUAN PARDO', ovr: 79 },
  { id: 'p4', name: 'DAVID LEÓN', ovr: 75 },
  { id: 'p5', name: 'NICOLÁS RUIZ', ovr: 71 },
];

function getGeneralRanking() {
  const me = { id: 'me', name: state.name, ovr: state.ovr, rank: getRank(state.xp).name };
  const list = MOCK_PLAYERS.map(p => ({ ...p, rank: getRank(p.ovr * 130).name })).concat([me]);
  return list.sort((a, b) => b.ovr - a.ovr);
}

function renderRanking() {
  const list = getGeneralRanking();
  document.getElementById('rk-panel').innerHTML = list.map((p, i) => `
    <div class="rk-row ${p.id === 'me' ? 'me' : ''}">
      <div class="rk-pos ${i === 0 ? 'gold' : ''}">${i + 1}</div>
      <div class="rk-av">${p.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
      <div class="rk-info"><div class="rk-name">${p.name}${p.id === 'me' ? ' (TÚ)' : ''}</div><div class="rk-rank">${p.rank}</div></div>
      <div class="rk-ovr">${p.ovr}</div>
    </div>
  `).join('');
}

function renderNotifications() {
  document.getElementById('notif-count').textContent = state.notifications.length;
  const el = document.getElementById('notif-list');
  if (!state.notifications.length) {
    el.innerHTML = `<div class="notif-empty">No tienes notificaciones.</div>`;
    return;
  }
  el.innerHTML = state.notifications.slice().reverse().map(n => `
    <div class="notif-row">
      <div class="notif-icon">${n.icon}</div>
      <div><div class="notif-txt">${n.text}</div><div class="notif-time">${n.time}</div></div>
    </div>
  `).join('');
}

function renderWipGrid() {
  document.getElementById('wip-grid').innerHTML = WIP_MODULES.map(m => `
    <div class="wip-tile" onclick="openWip('${m.name}')">
      <div class="wip-tile-stripes"></div>
      <div class="wip-tile-icon">${m.icon}</div>
      <div class="wip-tile-name">${m.name}</div>
      <div class="wip-tile-tag">EN CONSTRUCCIÓN</div>
    </div>
  `).join('');
}

function renderAll() {
  renderNav();
  renderHero();
  renderCard();
  renderHistory();
  renderRanking();
  renderNotifications();
  renderWipGrid();
  const btn = document.getElementById('profile-btn');
  if (btn && state) btn.textContent = state.name.split(' ')[0];
}

function goTo(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function openWip(name) {
  document.getElementById('wip-modal-title').textContent = name;
  document.getElementById('wip-modal').classList.add('open');
}
function closeWip() {
  document.getElementById('wip-modal').classList.remove('open');
}

function addNotification(icon, text) {
  state.notifications.push({ icon, text, time: 'AHORA' });
}

function simularPartido() {
  const outcomes = [
    { label: 'VICTORIA', w: 3 },
    { label: 'EMPATE', w: 2 },
    { label: 'DERROTA', w: 1 },
  ];
  const pick = outcomes[Math.floor(Math.random() * outcomes.length)];
  const golesFav = Math.floor(Math.random() * 4) + (pick.label === 'VICTORIA' ? 2 : 0);
  const golesRiv = pick.label === 'DERROTA' ? golesFav + Math.ceil(Math.random() * 2) : Math.max(0, golesFav - (pick.label === 'VICTORIA' ? Math.ceil(Math.random()*2) : 0));
  const goals = Math.floor(Math.random() * 3);
  const assists = Math.floor(Math.random() * 2);
  const isMvp = Math.random() < 0.25;
  const ovrDelta = isMvp ? (Math.random() < 0.8 ? 1 : 2) : (pick.label === 'DERROTA' ? (Math.random() < 0.3 ? -1 : 0) : (Math.random() < 0.5 ? 1 : 0));

  let xpGain = 50 + goals * 80 + assists * 60;
  if (isMvp) xpGain += 200;

  state.matches += 1;
  state.goals += goals;
  state.assists += assists;
  if (isMvp) state.mvps += 1;
  state.ovr = Math.max(40, Math.min(99, state.ovr + ovrDelta));
  state.xp += xpGain;

  const prevRank = getRank(state.xp - xpGain).name;
  const newRank = getRank(state.xp).name;

  const resultLabel = `${pick.label} ${golesFav}-${golesRiv}`;
  state.history.push({
    date: new Date().toLocaleDateString('es-CO'),
    result: resultLabel,
    mvp: isMvp,
    ovrDelta,
  });

  addNotification('⚡', 'Tu carta de LEVEL UP fue actualizada.');
  if (ovrDelta !== 0) addNotification(ovrDelta > 0 ? '📈' : '📉', `Tu OVR cambió a ${state.ovr} tras tu último partido.`);
  if (isMvp) addNotification('★', '¡Fuiste MVP de tu último partido!');
  if (newRank !== prevRank) addNotification('🔥', `Subiste de rango: ahora eres ${newRank}.`);

  saveState();
  renderAll();
  showPostMatch({ resultLabel, ovrDelta, xpGain, isMvp, achievement: newRank !== prevRank ? `Nuevo rango desbloqueado: ${newRank}` : null });
}

function showPostMatch({ resultLabel, ovrDelta, xpGain, isMvp, achievement }) {
  document.getElementById('post-match-content').innerHTML = `
    <div class="pm-label">ACTUALIZACIÓN POST-PARTIDO</div>
    <div class="pm-result">${resultLabel}</div>
    <div class="pm-stat"><div class="pm-stat-l">OVR</div><div class="pm-stat-v">${ovrDelta >= 0 ? '+' : ''}${ovrDelta}</div></div>
    <div class="pm-stat"><div class="pm-stat-l">XP GANADO</div><div class="pm-stat-v">+${xpGain}</div></div>
    ${isMvp ? `<div class="pm-mvp">★ MVP DEL PARTIDO</div>` : ''}
    ${achievement ? `<div class="pm-achievement">🏆 ${achievement}</div>` : ''}
    <button class="pm-close" onclick="closePostMatch()">VER MI CARTA</button>
  `;
  document.getElementById('post-match-modal').classList.add('open');
}

function closePostMatch() {
  document.getElementById('post-match-modal').classList.remove('open');
  goTo('carta');
}

/* ===== AUTH / PERFILES ===== */

let pendingPhoto = null;

function switchAuthTab(tab) {
  document.getElementById('tab-new').classList.toggle('on', tab === 'new');
  document.getElementById('tab-existing').classList.toggle('on', tab === 'existing');
  document.getElementById('auth-new').style.display = tab === 'new' ? 'block' : 'none';
  document.getElementById('auth-existing').style.display = tab === 'existing' ? 'block' : 'none';
  if (tab === 'existing') renderProfileList();
}

function renderProfileList() {
  const ids = Object.keys(profiles);
  const el = document.getElementById('auth-profile-list');
  if (!ids.length) {
    el.innerHTML = `<div class="auth-empty">Todavía no has creado ningún perfil.</div>`;
    return;
  }
  el.innerHTML = ids.map(id => {
    const p = profiles[id];
    const initials = p.name.split(' ').map(s => s[0]).join('').slice(0, 2);
    const photo = p.photo ? `<img class="auth-profile-photo" src="${p.photo}">` : `<div class="auth-profile-photo rk-av" style="display:flex;align-items:center;justify-content:center;font-family:var(--ft);font-size:10px">${initials}</div>`;
    return `
      <div class="auth-profile-row" onclick="selectProfile('${id}')">
        ${photo}
        <div>
          <div class="auth-profile-name">${p.name}</div>
          <div class="auth-profile-sub">${p.position} · OVR ${p.ovr}</div>
        </div>
        <div class="auth-profile-del" onclick="event.stopPropagation();deleteProfile('${id}')">✕</div>
      </div>
    `;
  }).join('');
}

function selectProfile(id) {
  setCurrentProfile(id);
  closeAuth();
  renderAll();
}

function deleteProfile(id) {
  delete profiles[id];
  saveProfiles();
  if (state && state.id === id) {
    state = null;
    localStorage.removeItem(CURRENT_KEY);
  }
  renderProfileList();
  if (!state) openAuth(true);
}

function onAuthPhotoChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingPhoto = reader.result;
    document.getElementById('auth-photo-preview').src = pendingPhoto;
    document.getElementById('auth-photo-preview').style.display = 'block';
    document.getElementById('auth-photo-placeholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function submitNewProfile() {
  const name = document.getElementById('auth-name').value.trim();
  const position = document.getElementById('auth-position').value;
  const team = document.getElementById('auth-team').value.trim();
  const errorEl = document.getElementById('auth-error');
  if (!name) {
    errorEl.textContent = 'Escribe tu nombre para crear tu carta.';
    return;
  }
  const profile = makeProfile({ name, position, team, photo: pendingPhoto });
  profiles[profile.id] = profile;
  saveProfiles();
  setCurrentProfile(profile.id);
  pendingPhoto = null;
  closeAuth();
  renderAll();
}

function openAuth(forced) {
  document.getElementById('auth-cancel').style.display = forced ? 'none' : 'block';
  switchAuthTab(Object.keys(profiles).length ? 'existing' : 'new');
  document.getElementById('auth-modal').classList.add('open');
}

function closeAuth() {
  document.getElementById('auth-modal').classList.remove('open');
}

function initApp() {
  if (!loadCurrentProfile()) {
    openAuth(true);
  } else {
    renderAll();
  }
  document.getElementById('profile-btn').onclick = () => openAuth(false);
}

initApp();
