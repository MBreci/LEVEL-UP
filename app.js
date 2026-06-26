/* ===== LEVEL UP — MVP ===== */

const BANNED_WORDS = [
  'puta', 'puto', 'mierda', 'pendejo', 'pendeja', 'cabron', 'cabrón', 'gonorrea',
  'malparido', 'malparida', 'hijueputa', 'hpta', 'verga', 'culo', 'marica', 'maricon', 'maricón',
  'perra', 'zorra', 'idiota', 'imbecil', 'imbécil', 'estupido', 'estúpido', 'estupida', 'estúpida',
  'mamavergas', 'chupavergas', 'nazi', 'hitler',
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'nigga', 'retard', 'retarded',
];

function normalizeForFilter(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function containsProfanity(text) {
  if (!text) return false;
  const norm = normalizeForFilter(text);
  return BANNED_WORDS.some(w => norm.includes(normalizeForFilter(w)));
}

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
  { id: 'ficha', label: 'MI FICHA' },
  { id: 'jugadores', label: 'JUGADORES' },
  { id: 'ranking', label: 'RANKING' },
  { id: 'historial', label: 'HISTORIAL' },
  { id: 'partidos', label: 'PARTIDOS' },
  { id: 'temporada', label: 'TEMPORADA BETA' },
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
const MATCHES_KEY = 'levelup_open_matches';
const INVITES_KEY = 'levelup_invites';

/* ===== SUPABASE (perfiles compartidos entre jugadores) ===== */
const SUPABASE_URL = 'https://vwihedjfxrilfdpmuzzu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2YSO3Wwkogd1Oa3V2zXl-Q_yad19S3_';
const sb = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

function profileToRow(p) {
  return {
    id: p.id, name: p.name, nickname: p.nickname, position: p.position, team: p.team,
    photo: p.photo, password_hash: p.passwordHash, ovr: p.ovr, xp: p.xp, lp: p.lp,
    last_update: p.lastUpdate, matches: p.matches, goals: p.goals, assists: p.assists, mvps: p.mvps,
    attrs: p.attrs, history: p.history, notifications: p.notifications, physical: p.physical,
  };
}

function rowToProfile(r) {
  return {
    id: r.id, name: r.name, nickname: r.nickname, position: r.position, team: r.team,
    photo: r.photo, passwordHash: r.password_hash, ovr: r.ovr, xp: r.xp, lp: r.lp,
    lastUpdate: r.last_update, matches: r.matches || 0, goals: r.goals || 0, assists: r.assists || 0, mvps: r.mvps || 0,
    attrs: r.attrs || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, fis: 60 },
    history: r.history || [], notifications: r.notifications || [],
    physical: r.physical || { weight: null, height: null, age: null, foot: null },
  };
}

async function pushProfileToCloud(p) {
  if (!sb) return;
  const { error } = await sb.from('profiles').upsert(profileToRow(p));
  if (error) console.error('Error guardando perfil en la nube:', error.message);
}

async function deleteProfileFromCloud(id) {
  if (!sb) return;
  const { error } = await sb.from('profiles').delete().eq('id', id);
  if (error) console.error('Error borrando perfil en la nube:', error.message);
}

async function syncProfilesFromCloud() {
  if (!sb) return;
  const { data, error } = await sb.from('profiles').select('*');
  if (error || !data) { console.error('Error sincronizando perfiles:', error && error.message); return; }
  data.forEach(row => {
    if (!state || row.id !== state.id) profiles[row.id] = rowToProfile(row);
  });
  saveProfiles();
  renderAll();
}

async function hashPassword(password) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isPasswordMediumStrength(password) {
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

function makeProfile({ name, position, team, nickname, passwordHash }) {
  return {
    id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: name.toUpperCase(),
    nickname: nickname ? nickname.toUpperCase() : '',
    position,
    team: team || 'SIN EQUIPO',
    photo: null,
    passwordHash,
    ovr: 60,
    xp: 0,
    lp: 0,
    lastUpdate: null,
    matches: 0,
    goals: 0,
    assists: 0,
    mvps: 0,
    attrs: { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, fis: 60 },
    physical: { weight: null, height: null, age: null, foot: null },
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
  pushProfileToCloud(state);
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

const PAGE_HREFS = {
  ficha: 'carta.html',
  jugadores: 'jugadores.html',
  ranking: 'ranking.html',
  historial: 'carta.html#historial',
  partidos: 'buscar-partido.html',
  temporada: 'temporada-piloto.html',
};

function getCurrentPage() {
  let page = location.pathname.split('/').pop() || 'index.html';
  if (page && !page.includes('.')) page += '.html';
  return page;
}

function renderNav() {
  const nav = document.getElementById('nav-modules');
  if (!nav) return;
  nav.innerHTML = '';
  if (!state) return;
  const page = getCurrentPage();
  FUNCTIONAL_MODULES.forEach(m => {
    const href = PAGE_HREFS[m.id] || '#';
    const el = document.createElement('a');
    el.className = 'nm-item nm-item-link';
    if (href.split('#')[0] === page) el.classList.add('on');
    el.textContent = m.label;
    el.href = href;
    nav.appendChild(el);
  });
}

function getPlatformStats() {
  const all = Object.values(profiles);
  return {
    jugadores: all.length,
    partidos: all.reduce((s, p) => s + (p.matches || 0), 0),
    goles: all.reduce((s, p) => s + (p.goals || 0), 0),
    mvps: all.reduce((s, p) => s + (p.mvps || 0), 0),
  };
}

function renderHero() {
  const el = document.getElementById('hero-stats');
  if (el) {
    const stats = getPlatformStats();
    el.innerHTML = `
      <div class="h-stat"><div class="h-stat-n">${stats.jugadores}</div><div class="h-stat-l">JUGADORES</div></div>
      <div class="h-stat"><div class="h-stat-n">${stats.partidos}</div><div class="h-stat-l">PARTIDOS</div></div>
      <div class="h-stat"><div class="h-stat-n">${stats.goles}</div><div class="h-stat-l">GOLES</div></div>
      <div class="h-stat"><div class="h-stat-n">${stats.mvps}</div><div class="h-stat-l">MVP OTORGADOS</div></div>
    `;
  }
  const top = getGeneralRanking()[0];
  const ovrCard = document.getElementById('hero-float-ovr');
  if (ovrCard) {
    ovrCard.innerHTML = top
      ? `<div class="hf-n">${top.ovr}</div><div class="hf-l">OVR MÁS ALTO</div>`
      : `<div class="hf-n">--</div><div class="hf-l">SÉ EL PRIMERO</div>`;
  }
  const rankCard = document.getElementById('hero-float-rank');
  if (rankCard) {
    rankCard.innerHTML = top
      ? `<div class="hf-l">TOP JUGADOR</div><div class="hf-n2">${top.name}</div>`
      : `<div class="hf-l">TOP JUGADOR</div><div class="hf-n2">AÚN NADIE</div>`;
  }
}

function guestPrompt(text) {
  return `<div class="guest-prompt"><div class="guest-prompt-text">${text}</div><button class="guest-prompt-btn" onclick="openAuth(false)">INICIAR SESIÓN</button></div>`;
}

function buildCardHTML(p) {
  const rank = getRank(p.xp || 0);
  const a = p.attrs || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, fis: 60 };
  const epicRanks = ['rival', 'elite', 'apex', 'legacy'];
  const tier = rank.name.toLowerCase();
  const className = 'fifa rk-' + tier + (epicRanks.includes(tier) ? ' epic' : '');
  const html = `
    <div class="fc-shine"></div>
    ${epicRanks.includes(tier) ? '<div class="fc-sparks"></div>' : ''}
    <span class="fc-corner tl"></span>
    <span class="fc-corner tr"></span>
    <span class="fc-corner bl"></span>
    <span class="fc-corner br"></span>
    <div class="fc-crest"><span class="fc-crest-orn">◆</span> LEVEL UP <span class="fc-crest-orn">◆</span></div>
    <div class="fc-head">
      <div><div class="fc-ovr">${p.ovr}</div><div class="fc-pos">${p.position}</div></div>
      <div class="fc-rank">${rank.name}</div>
    </div>
    <div class="fc-player"><div class="fc-spotlight"></div>${p.photo ? `<img class="fc-photo-img" src="${p.photo}">` : `<div class="fc-photo-placeholder"><span class="fc-photo-icon">📷</span><span class="fc-photo-text">${p.id === (state && state.id) ? 'TU FOTO SE TOMARÁ EN TU PRIMER PARTIDO EN LA CANCHA' : 'AÚN SIN FOTO OFICIAL'}</span></div>`}</div>
    <div class="fc-namebar"><div class="fc-name">${p.name}${p.nickname ? ` <span class="fc-nick">"${p.nickname}"</span>` : ''}</div></div>
    <div class="fc-attrs">
      <div class="fca"><div class="fca-v">${a.pac}</div><div class="fca-l">PAC</div></div>
      <div class="fca"><div class="fca-v">${a.sho}</div><div class="fca-l">SHO</div></div>
      <div class="fca"><div class="fca-v">${a.pas}</div><div class="fca-l">PAS</div></div>
      <div class="fca"><div class="fca-v">${a.dri}</div><div class="fca-l">DRI</div></div>
      <div class="fca"><div class="fca-v">${a.def}</div><div class="fca-l">DEF</div></div>
      <div class="fca"><div class="fca-v">${a.fis}</div><div class="fca-l">FIS</div></div>
    </div>
    <div class="fc-foot"><div class="fc-team">${p.team}</div></div>
  `;
  return { className, html };
}

function buildPhysicalHTML(p) {
  const ph = p.physical || {};
  const row = (label, val, unit) => `
    <div class="phys-box ${val == null ? 'pending' : ''}">
      <div class="phys-l">${label}</div>
      <div class="phys-v">${val == null ? 'PENDIENTE' : val + (unit || '')}</div>
    </div>`;
  return `
    <div class="phys-grid">
      ${row('PESO', ph.weight, ' kg')}
      ${row('ALTURA', ph.height, ' cm')}
      ${row('EDAD', ph.age, ' años')}
      ${row('PIE', ph.foot)}
    </div>`;
}

function renderCard() {
  const card = document.getElementById('fifa-card');
  if (!card) return;
  const piEl0 = document.getElementById('player-info');
  if (!state) {
    card.className = 'fifa rk-rookie';
    card.innerHTML = '';
    if (piEl0) piEl0.innerHTML = guestPrompt('Inicia sesión o crea tu perfil para ver tu carta de jugador.');
    return;
  }
  const rank = getRank(state.xp);
  const a = state.attrs;
  const { className, html } = buildCardHTML(state);
  card.className = className;
  card.innerHTML = html;

  const next = getNextRank(state.xp);
  const prevMin = rank.min;
  const nextMin = next ? next.min : prevMin + 1;
  const pct = next ? Math.min(100, Math.round(((state.xp - prevMin) / (nextMin - prevMin)) * 100)) : 100;
  const rankPos = getGeneralRanking().findIndex(p => state && p.id === state.id) + 1;

  const piEl = document.getElementById('player-info');
  if (!piEl) return;
  piEl.innerHTML = `
    <div class="pi-name">${state.name} ${state.nickname ? `<span class="pi-nick" onclick="editNickname()">"${state.nickname}" ✎</span>` : `<span class="pi-nick pi-nick-add" onclick="editNickname()">+ AGREGAR APODO</span>`}</div>
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
    <div class="attr-bars-title">FICHA FÍSICA</div>
    ${buildPhysicalHTML(state)}
    <div class="bars">
      <div class="bar">
        <div class="bar-top"><span class="bar-l">OVERALL (OVR)</span><span class="bar-n">${state.ovr}/100</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${state.ovr}%"></div></div>
      </div>
    </div>
    <div class="attr-bars">
      <div class="attr-bars-title">ATRIBUTOS</div>
      <div class="attr-bar pac">
        <div class="attr-bar-top"><span class="attr-bar-l">PAC · RITMO</span><span class="attr-bar-n">${a.pac}</span></div>
        <div class="attr-bar-track"><div class="attr-bar-fill" style="width:${a.pac}%"></div></div>
      </div>
      <div class="attr-bar sho">
        <div class="attr-bar-top"><span class="attr-bar-l">SHO · TIRO</span><span class="attr-bar-n">${a.sho}</span></div>
        <div class="attr-bar-track"><div class="attr-bar-fill" style="width:${a.sho}%"></div></div>
      </div>
      <div class="attr-bar pas">
        <div class="attr-bar-top"><span class="attr-bar-l">PAS · PASE</span><span class="attr-bar-n">${a.pas}</span></div>
        <div class="attr-bar-track"><div class="attr-bar-fill" style="width:${a.pas}%"></div></div>
      </div>
      <div class="attr-bar dri">
        <div class="attr-bar-top"><span class="attr-bar-l">DRI · REGATE</span><span class="attr-bar-n">${a.dri}</span></div>
        <div class="attr-bar-track"><div class="attr-bar-fill" style="width:${a.dri}%"></div></div>
      </div>
      <div class="attr-bar def">
        <div class="attr-bar-top"><span class="attr-bar-l">DEF · DEFENSA</span><span class="attr-bar-n">${a.def}</span></div>
        <div class="attr-bar-track"><div class="attr-bar-fill" style="width:${a.def}%"></div></div>
      </div>
      <div class="attr-bar fis">
        <div class="attr-bar-top"><span class="attr-bar-l">FIS · FÍSICO</span><span class="attr-bar-n">${a.fis}</span></div>
        <div class="attr-bar-track"><div class="attr-bar-fill" style="width:${a.fis}%"></div></div>
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
  if (!el) return;
  if (!state) {
    el.innerHTML = guestPrompt('Inicia sesión para ver tu historial de partidos.');
    return;
  }
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

function getGeneralRanking() {
  const list = Object.values(profiles).map(p => ({ id: p.id, name: p.nickname || p.name, ovr: p.ovr, rank: getRank(p.xp).name }));
  return list.sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));
}

function renderRanking() {
  const el = document.getElementById('rk-panel');
  if (!el) return;
  const list = getGeneralRanking();
  if (!list.length) {
    el.innerHTML = `<div class="rk-empty">Todavía no hay jugadores registrados. Cuando alguien cree su perfil, aparecerá aquí.</div>`;
    return;
  }
  el.innerHTML = list.map((p, i) => `
    <div class="rk-row ${state && p.id === state.id ? 'me' : ''}">
      <div class="rk-pos ${i === 0 ? 'gold' : ''}">${i + 1}</div>
      <div class="rk-av">${p.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
      <div class="rk-info"><div class="rk-name">${p.name}${state && p.id === state.id ? ' (TÚ)' : ''}</div><div class="rk-rank">${p.rank}</div></div>
      <div class="rk-ovr">${p.ovr}</div>
    </div>
  `).join('');
}

function renderPlayerSearch(query) {
  const el = document.getElementById('pl-grid');
  if (!el) return;
  const q = (query || '').trim().toLowerCase();
  const list = Object.values(profiles)
    .filter(p => !q || p.name.toLowerCase().includes(q) || (p.nickname || '').toLowerCase().includes(q) || p.team.toLowerCase().includes(q))
    .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));
  if (!list.length) {
    el.innerHTML = `<div class="rk-empty">No se encontraron jugadores.</div>`;
    return;
  }
  el.innerHTML = list.map(p => {
    const rank = getRank(p.xp);
    return `
    <div class="pl-card" onclick="openPlayerView('${p.id}')">
      <div class="pl-card-av">${p.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>
      <div class="pl-card-name">${p.nickname || p.name}</div>
      <div class="pl-card-sub">${p.position} · ${p.team}</div>
      <div class="pl-card-tags"><span class="pi-tag g">${rank.name}</span><span class="pi-tag gold">OVR ${p.ovr}</span></div>
    </div>`;
  }).join('');
  renderPlayerSuggestions(query);
}

function renderPlayerSuggestions(query) {
  const box = document.getElementById('pl-suggest');
  if (!box) return;
  const q = (query || '').trim().toLowerCase();
  if (!q) { box.classList.remove('open'); box.innerHTML = ''; return; }
  const list = Object.values(profiles)
    .filter(p => p.name.toLowerCase().includes(q) || (p.nickname || '').toLowerCase().includes(q))
    .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name))
    .slice(0, 6);
  if (!list.length) { box.classList.remove('open'); box.innerHTML = ''; return; }
  box.innerHTML = list.map(p => `
    <div class="pl-suggest-item" onclick="selectPlayerSuggestion('${p.id}')">
      <span>${p.nickname || p.name}</span>
      <span class="s-sub">${p.position} · ${p.team}</span>
    </div>`).join('');
  box.classList.add('open');
}

function selectPlayerSuggestion(id) {
  closePlayerSuggestions();
  const input = document.getElementById('pl-search');
  const p = profiles[id];
  if (input && p) input.value = p.nickname || p.name;
  openPlayerView(id);
}

function closePlayerSuggestions() {
  const box = document.getElementById('pl-suggest');
  if (box) { box.classList.remove('open'); }
}

function openPlayerView(id) {
  const p = profiles[id];
  const modal = document.getElementById('player-view-modal');
  const content = document.getElementById('player-view-content');
  if (!modal || !content) return;
  if (!p) {
    content.innerHTML = `<div class="rk-empty">No se pudo cargar este jugador.</div>`;
    modal.classList.add('open');
    return;
  }
  try {
    const { className, html } = buildCardHTML(p);
    content.innerHTML = `<div class="${className}">${html}</div>`;
  } catch (e) {
    console.error('Error mostrando ficha de jugador:', e);
    content.innerHTML = `<div class="rk-empty">No se pudo cargar la ficha de este jugador.</div>`;
  }
  modal.classList.add('open');
}

function closePlayerView() {
  const modal = document.getElementById('player-view-modal');
  if (modal) modal.classList.remove('open');
}

function renderNotifications() {
  const countEl = document.getElementById('notif-count');
  if (!state) {
    if (countEl) countEl.textContent = '0';
    const el0 = document.getElementById('notif-list');
    if (el0) el0.innerHTML = guestPrompt('Inicia sesión para ver tus notificaciones.');
    return;
  }
  const myInvites = getMyInvites();
  if (countEl) countEl.textContent = state.notifications.length + myInvites.filter(i => i.status === 'pendiente').length;
  const el = document.getElementById('notif-list');
  if (!el) return;
  if (!state.notifications.length && !myInvites.length) {
    el.innerHTML = `<div class="notif-empty">No tienes notificaciones.</div>`;
    return;
  }
  const inviteRows = myInvites.slice().reverse().map(inv => `
    <div class="notif-invite">
      <div class="notif-invite-txt">⚽ <strong>${inv.fromName}</strong> te invitó a su partido en ${inv.zona} — ${inv.fecha}</div>
      ${inv.status === 'pendiente'
        ? `<div class="notif-invite-actions">
            <button class="notif-accept" onclick="respondInvite('${inv.id}',true)">ACEPTAR</button>
            <button class="notif-reject" onclick="respondInvite('${inv.id}',false)">RECHAZAR</button>
          </div>`
        : `<div class="notif-invite-status">${inv.status === 'aceptada' ? '✓ ACEPTASTE ESTA INVITACIÓN' : '✕ RECHAZASTE ESTA INVITACIÓN'}</div>`}
    </div>
  `).join('');
  const normalRows = state.notifications.slice().reverse().map(n => `
    <div class="notif-row">
      <div class="notif-icon">${n.icon}</div>
      <div><div class="notif-txt">${n.text}</div><div class="notif-time">${n.time}</div></div>
    </div>
  `).join('');
  el.innerHTML = inviteRows + normalRows;
}

function renderWipGrid() {
  const el = document.getElementById('wip-grid');
  if (!el) return;
  el.innerHTML = WIP_MODULES.map(m => `
    <div class="wip-tile" onclick="openWip('${m.name}')">
      <div class="wip-tile-stripes"></div>
      <div class="wip-tile-icon">${m.icon}</div>
      <div class="wip-tile-name">${m.name}</div>
      <div class="wip-tile-tag">EN CONSTRUCCIÓN</div>
    </div>
  `).join('');
}

function updateProfileBtn() {
  const btn = document.getElementById('profile-btn');
  if (!btn) return;
  if (state) {
    btn.textContent = (state.nickname || state.name).split(' ')[0];
    btn.onclick = () => toggleDropdown('account-dropdown');
  } else {
    btn.textContent = 'INICIAR SESIÓN';
    btn.onclick = () => openAuth();
  }
}

function renderAll() {
  renderNav();
  renderHero();
  renderCard();
  renderHistory();
  renderRanking();
  renderPlayerSearch(document.getElementById('pl-search') ? document.getElementById('pl-search').value : '');
  renderNotifications();
  renderWipGrid();
  renderBuscarPartido();
  renderTicker();
  updateProfileBtn();
  renderDashboard();
}

function renderDashboard() {
  const el = document.getElementById('dash-content');
  if (!el || !state) return;
  const rank = getRank(state.xp);
  const nextRank = getNextRank(state.xp);
  const rankPos = getGeneralRanking().findIndex(p => state && p.id === state.id) + 1;
  const lu = state.lastUpdate;
  const nextMatch = openMatches.find(m => m.creatorId === state.id && m.estado === 'abierto');
  const recentNotifs = state.notifications.slice(-3).reverse();
  const xpPct = nextRank ? Math.min(100, Math.round(((state.xp - rank.min) / (nextRank.min - rank.min)) * 100)) : 100;
  el.innerHTML = `
    <div class="dash-welcome">BIENVENIDO DE NUEVO, ${(state.nickname || state.name).split(' ')[0]}</div>
    <div class="dash-top-stats">
      <div class="dash-stat acc-g"><div class="dash-stat-v">${state.ovr}</div><div class="dash-stat-l">OVR</div></div>
      <div class="dash-stat acc-f"><div class="dash-stat-v">${rank.name}</div><div class="dash-stat-l">RANGO</div></div>
      <div class="dash-stat acc-o"><div class="dash-stat-v">${state.xp}</div><div class="dash-stat-l">XP</div></div>
      <div class="dash-stat acc-w"><div class="dash-stat-v">${state.lp || 0}</div><div class="dash-stat-l">LP</div></div>
    </div>
    <div class="dash-xp-card">
      <div class="dash-xp-head">
        <span>PROGRESO DE RANGO</span>
        <span>${nextRank ? `${xpPct}% · FALTAN ${nextRank.min - state.xp} XP PARA ${nextRank.name}` : 'RANGO MÁXIMO ALCANZADO'}</span>
      </div>
      <div class="dash-xp-track"><div class="dash-xp-fill" style="width:${xpPct}%"></div></div>
    </div>
    ${lu ? `
    <div class="dash-card acc-g">
      <div class="dash-card-title">🔥 ÚLTIMA ACTUALIZACIÓN</div>
      <div class="dash-update-row">
        <span>OVR ${lu.ovrDelta >= 0 ? '+' : ''}${lu.ovrDelta}</span>
        <span>XP +${lu.xpGain}</span>
        <span>LP +${lu.lpGain}</span>
      </div>
    </div>` : ''}
    <div class="dash-card acc-f">
      <div class="dash-card-title">⚽ PRÓXIMO PARTIDO</div>
      ${nextMatch ? `
        <div class="dash-match-info">${nextMatch.zona}${nextMatch.cancha ? ' · ' + nextMatch.cancha : ''} — ${nextMatch.fecha}</div>
        <button class="dash-btn" onclick="location.href='buscar-partido.html'">VER PARTIDO</button>
      ` : `<div class="dash-empty">No tienes búsquedas activas. Publica una en "PARTIDOS".</div>`}
    </div>
    <div class="dash-card acc-o">
      <div class="dash-card-title">🏆 RANKING</div>
      <div class="dash-rank-pos">TU POSICIÓN ACTUAL: #${rankPos}</div>
    </div>
    <div class="dash-card acc-w">
      <div class="dash-card-title">📋 ACTIVIDAD RECIENTE</div>
      ${recentNotifs.length ? recentNotifs.map(n => `<div class="dash-activity-row">${n.icon} ${n.text}</div>`).join('') : `<div class="dash-empty">Sin actividad reciente.</div>`}
    </div>
  `;
}

function toggleDropdown(id) {
  document.querySelectorAll('.dropdown-menu.open').forEach(d => { if (d.id !== id) d.classList.remove('open'); });
  document.getElementById(id).classList.toggle('open');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown-wrap')) {
    document.querySelectorAll('.dropdown-menu.open').forEach(d => d.classList.remove('open'));
  }
});

function logout() {
  state = null;
  localStorage.removeItem(CURRENT_KEY);
  document.querySelectorAll('.dropdown-menu.open').forEach(d => d.classList.remove('open'));
  location.href = 'index.html';
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
  if (!state) { openAuth(true); return; }
  document.getElementById('sim-result-modal').classList.add('open');
}

function closeSimResult() {
  document.getElementById('sim-result-modal').classList.remove('open');
}

function registrarResultado(resultado) {
  closeSimResult();
  const golesFav = Math.floor(Math.random() * 4) + (resultado === 'VICTORIA' ? 2 : 0);
  const golesRiv = resultado === 'DERROTA' ? golesFav + Math.ceil(Math.random() * 2) : resultado === 'EMPATE' ? golesFav : Math.max(0, golesFav - Math.ceil(Math.random() * 2));
  const goals = Math.floor(Math.random() * 3);
  const assists = Math.floor(Math.random() * 2);
  const isMvp = Math.random() < 0.25;
  const ovrDelta = isMvp ? (Math.random() < 0.8 ? 1 : 2) : (resultado === 'DERROTA' ? (Math.random() < 0.3 ? -1 : 0) : (Math.random() < 0.5 ? 1 : 0));

  let xpGain = 50 + goals * 80 + assists * 60;
  if (resultado === 'VICTORIA') xpGain += 100;
  if (isMvp) xpGain += 200;

  const lpGain = resultado === 'VICTORIA' ? 25 : resultado === 'EMPATE' ? 10 : 5;

  state.matches += 1;
  state.goals += goals;
  state.assists += assists;
  if (isMvp) state.mvps += 1;
  state.ovr = Math.max(40, Math.min(99, state.ovr + ovrDelta));
  ['pac', 'sho', 'pas', 'dri', 'def', 'fis'].forEach((k) => {
    const jitter = Math.floor(Math.random() * 3) - 1;
    state.attrs[k] = Math.max(40, Math.min(99, state.attrs[k] + ovrDelta + jitter));
  });
  state.xp += xpGain;
  state.lp = (state.lp || 0) + lpGain;
  state.lastUpdate = { ovrDelta, xpGain, lpGain };

  const prevRank = getRank(state.xp - xpGain).name;
  const newRank = getRank(state.xp).name;

  const resultLabel = `${resultado} ${golesFav}-${golesRiv}`;
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
  showPostMatch({ resultLabel, ovrDelta, xpGain, lpGain, isMvp, achievement: newRank !== prevRank ? `Nuevo rango desbloqueado: ${newRank}` : null });
}

function showPostMatch({ resultLabel, ovrDelta, xpGain, lpGain, isMvp, achievement }) {
  document.getElementById('post-match-content').innerHTML = `
    <div class="pm-label">ACTUALIZACIÓN POST-PARTIDO</div>
    <div class="pm-result">${resultLabel}</div>
    <div class="pm-stat"><div class="pm-stat-l">OVR</div><div class="pm-stat-v">${ovrDelta >= 0 ? '+' : ''}${ovrDelta}</div></div>
    <div class="pm-stat"><div class="pm-stat-l">XP GANADO</div><div class="pm-stat-v">+${xpGain}</div></div>
    <div class="pm-stat"><div class="pm-stat-l">LP GANADO</div><div class="pm-stat-v">+${lpGain}</div></div>
    ${isMvp ? `<div class="pm-mvp">★ MVP DEL PARTIDO</div>` : ''}
    ${achievement ? `<div class="pm-achievement">🏆 ${achievement}</div>` : ''}
    <button class="pm-close" onclick="closePostMatch()">VER MI CARTA</button>
  `;
  document.getElementById('post-match-modal').classList.add('open');
}

function closePostMatch() {
  document.getElementById('post-match-modal').classList.remove('open');
  location.href = 'carta.html';
}

/* ===== AUTH / PERFILES ===== */

function switchAuthTab(tab) {
  document.getElementById('tab-new').classList.toggle('on', tab === 'new');
  document.getElementById('tab-existing').classList.toggle('on', tab === 'existing');
  document.getElementById('auth-new').style.display = tab === 'new' ? 'block' : 'none';
  document.getElementById('auth-existing').style.display = tab === 'existing' ? 'block' : 'none';
  document.getElementById('auth-reset').style.display = 'none';
}

function normalizeId(text) {
  return text.trim().toUpperCase();
}

async function findProfileByIdentifier(identifier) {
  const id = normalizeId(identifier);
  const local = Object.values(profiles).find(p => p.name === id || p.nickname === id);
  if (local) return local;
  if (!sb) return null;
  const { data: byName } = await sb.from('profiles').select('*').eq('name', id).limit(1);
  if (byName && byName.length) return rowToProfile(byName[0]);
  const { data: byNick } = await sb.from('profiles').select('*').eq('nickname', id).limit(1);
  if (byNick && byNick.length) return rowToProfile(byNick[0]);
  return null;
}

async function submitLogin() {
  const identifier = document.getElementById('login-id').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-submit');
  if (!identifier.trim() || !password) {
    errorEl.textContent = 'Escribe tu nombre o apodo y tu contraseña.';
    return;
  }
  errorEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'VERIFICANDO...';
  try {
    const profile = await findProfileByIdentifier(identifier);
    const hash = await hashPassword(password);
    if (!profile || hash !== profile.passwordHash) {
      errorEl.textContent = 'Nombre/apodo o contraseña incorrectos.';
      return;
    }
    profiles[profile.id] = profile;
    saveProfiles();
    setCurrentProfile(profile.id);
    closeAuth();
    document.getElementById('login-id').value = '';
    document.getElementById('login-password').value = '';
    if (getCurrentPage() === 'index.html') { location.href = 'dashboard.html'; return; }
    renderAll();
  } finally {
    btn.disabled = false;
    btn.textContent = 'INICIAR SESIÓN';
  }
}

function showResetPassword() {
  document.getElementById('auth-existing').style.display = 'none';
  document.getElementById('auth-reset').style.display = 'block';
}

function backToLogin() {
  document.getElementById('auth-reset').style.display = 'none';
  document.getElementById('auth-existing').style.display = 'block';
}

async function submitResetPassword() {
  const identifier = document.getElementById('reset-id').value;
  const password = document.getElementById('reset-password').value;
  const passwordConfirm = document.getElementById('reset-password-confirm').value;
  const errorEl = document.getElementById('reset-error');
  const btn = document.getElementById('reset-submit');
  if (!identifier.trim()) {
    errorEl.textContent = 'Escribe el nombre o apodo de tu cuenta.';
    return;
  }
  if (!isPasswordMediumStrength(password)) {
    errorEl.textContent = 'La nueva contraseña debe tener mínimo 6 caracteres, con letras y números.';
    return;
  }
  if (password !== passwordConfirm) {
    errorEl.textContent = 'Las contraseñas no coinciden.';
    return;
  }
  errorEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'ACTUALIZANDO...';
  try {
    const profile = await findProfileByIdentifier(identifier);
    if (!profile) {
      errorEl.textContent = 'No encontramos ninguna cuenta con ese nombre o apodo.';
      return;
    }
    profile.passwordHash = await hashPassword(password);
    profiles[profile.id] = profile;
    saveProfiles();
    pushProfileToCloud(profile);
    document.getElementById('reset-id').value = '';
    document.getElementById('reset-password').value = '';
    document.getElementById('reset-password-confirm').value = '';
    backToLogin();
    document.getElementById('login-id').value = identifier.trim();
    document.getElementById('login-error').textContent = '';
    errorEl.textContent = '';
    alert('Tu contraseña fue actualizada. Ya puedes iniciar sesión con tu nueva contraseña.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'ACTUALIZAR CONTRASEÑA';
  }
}

function deleteProfile(id) {
  delete profiles[id];
  saveProfiles();
  deleteProfileFromCloud(id);
  if (state && state.id === id) {
    state = null;
    localStorage.removeItem(CURRENT_KEY);
  }
  if (!state) openAuth(true);
}

async function submitNewProfile() {
  const name = document.getElementById('auth-name').value.trim();
  const nickname = document.getElementById('auth-nickname').value.trim();
  const position = document.getElementById('auth-position').value;
  const team = document.getElementById('auth-team').value.trim();
  const password = document.getElementById('auth-password').value;
  const passwordConfirm = document.getElementById('auth-password-confirm').value;
  const consent = document.getElementById('auth-consent');
  const errorEl = document.getElementById('auth-error');
  if (!name) {
    errorEl.textContent = 'Escribe tu nombre para crear tu carta.';
    return;
  }
  if (containsProfanity(name) || containsProfanity(nickname) || containsProfanity(team)) {
    errorEl.textContent = 'Tu nombre, apodo o equipo contiene lenguaje ofensivo. Por favor elige otro.';
    return;
  }
  if (!isPasswordMediumStrength(password)) {
    errorEl.textContent = 'La contraseña debe tener mínimo 6 caracteres, con letras y números.';
    return;
  }
  if (password !== passwordConfirm) {
    errorEl.textContent = 'Las contraseñas no coinciden.';
    return;
  }
  if (!consent.checked) {
    errorEl.textContent = 'Debes aceptar la Política de Tratamiento de Datos Personales y de Imagen para crear tu cuenta.';
    return;
  }
  const existing = await findProfileByIdentifier(name) || (nickname ? await findProfileByIdentifier(nickname) : null);
  if (existing) {
    errorEl.textContent = 'Ya existe una cuenta con ese nombre o apodo. Inicia sesión o elige otro.';
    return;
  }
  errorEl.textContent = '';
  const passwordHash = await hashPassword(password);
  const profile = makeProfile({ name, position, team, nickname, passwordHash });
  profiles[profile.id] = profile;
  saveProfiles();
  pushProfileToCloud(profile);
  setCurrentProfile(profile.id);
  closeAuth();
  if (getCurrentPage() === 'index.html') { location.href = 'dashboard.html'; return; }
  renderAll();
}

function editNickname() {
  const current = state.nickname || '';
  const value = prompt('¿Cuál es tu apodo?', current);
  if (value === null) return;
  const trimmed = value.trim();
  if (containsProfanity(trimmed)) {
    alert('Ese apodo contiene lenguaje ofensivo. Por favor elige otro.');
    return;
  }
  state.nickname = trimmed.toUpperCase();
  saveState();
  renderAll();
}

function openAuth(forceNew) {
  switchAuthTab(forceNew ? 'new' : 'existing');
  document.getElementById('auth-modal').classList.add('open');
}

function closeAuth() {
  document.getElementById('auth-modal').classList.remove('open');
}

/* ===== BUSCAR PARTIDO ===== */

function loadOpenMatches() {
  try { return JSON.parse(localStorage.getItem(MATCHES_KEY)) || []; } catch { return []; }
}
function saveOpenMatches() {
  localStorage.setItem(MATCHES_KEY, JSON.stringify(openMatches));
}

let openMatches = loadOpenMatches();

function openMatchForm() {
  if (!state) { openAuth(false); return; }
  const form = document.getElementById('bp-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function formatFechaPartido(dateStr, horaLabel) {
  const d = new Date(dateStr + 'T00:00:00');
  const dateLabel = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
  return `${dateLabel.charAt(0).toUpperCase()}${dateLabel.slice(1)}, ${horaLabel}`;
}

function submitMatchRequest() {
  if (!state) { openAuth(true); return; }
  const zona = document.getElementById('bp-zona').value;
  const cancha = document.getElementById('bp-cancha').value.trim();
  const formato = document.getElementById('bp-formato').value;
  const superficie = document.getElementById('bp-superficie').value;
  const fechaDate = document.getElementById('bp-fecha-date').value;
  const horaSel = document.getElementById('bp-fecha-hora');
  const errorEl = document.getElementById('bp-error');
  const chips = document.querySelectorAll('#bp-pos-grid .bp-pos-chip');
  const necesita = [];
  chips.forEach(chip => {
    const checkbox = chip.querySelector('input[type=checkbox]');
    const n = chip.querySelector('.bp-pos-n');
    if (checkbox.checked) {
      necesita.push({ pos: checkbox.value, cupos: parseInt(n.value, 10) || 1, unidos: [] });
    }
  });
  if (!fechaDate) {
    errorEl.textContent = 'Selecciona la fecha del partido.';
    return;
  }
  const fecha = formatFechaPartido(fechaDate, horaSel.options[horaSel.selectedIndex].textContent);
  if (necesita.length === 0) {
    errorEl.textContent = 'Selecciona al menos una posición que te falte.';
    return;
  }
  errorEl.textContent = '';
  openMatches.unshift({
    id: 'm_' + Date.now(),
    creatorId: state.id,
    creatorName: state.nickname || state.name,
    zona,
    cancha: cancha || null,
    formato,
    superficie,
    fecha,
    necesita,
    estado: 'abierto',
    createdAt: Date.now(),
  });
  saveOpenMatches();
  document.getElementById('bp-fecha-date').value = '';
  document.getElementById('bp-cancha').value = '';
  chips.forEach(chip => { chip.querySelector('input[type=checkbox]').checked = false; });
  openMatchForm();
  renderAll();
}

function joinMatchRequest(matchId, pos) {
  if (!state) { openAuth(true); return; }
  const match = openMatches.find(m => m.id === matchId);
  if (!match) return;
  const slot = match.necesita.find(n => n.pos === pos);
  if (!slot || slot.unidos.length >= slot.cupos) return;
  if (slot.unidos.some(u => u.profileId === state.id)) return;
  slot.unidos.push({ profileId: state.id, name: state.nickname || state.name });
  if (match.necesita.every(n => n.unidos.length >= n.cupos)) match.estado = 'completo';
  saveOpenMatches();
  addNotification('⚽', `Te uniste al partido en ${match.zona} (${pos}) — ${match.fecha}`);
  saveState();
  renderAll();
}

function renderBuscarPartido() {
  const list = document.getElementById('bp-list');
  if (!list) return;
  renderMyMatches();
  if (openMatches.length === 0) {
    list.innerHTML = `<div class="bp-empty">Aún no hay búsquedas activas. Publica la tuya y otros jugadores podrán unirse para completar tu equipo.</div>`;
    return;
  }
  list.innerHTML = openMatches.map(m => `
    <div class="bp-card">
      <div class="bp-info">
        <div class="bp-zona">${m.zona}${m.cancha ? ' · ' + m.cancha : ''}</div>
        <div class="bp-tags"><span class="bp-tag">FÚTBOL ${m.formato}</span><span class="bp-tag">${m.superficie}</span></div>
        <div class="bp-meta">${m.fecha}</div>
        <div class="bp-creator">Organiza: ${m.creatorName}</div>
      </div>
      <div class="bp-needs">
        ${m.necesita.map(n => {
          const full = n.unidos.length >= n.cupos;
          const joined = !!state && n.unidos.some(u => u.profileId === state.id);
          return `<div class="bp-need-chip ${full ? 'full' : ''}">${n.pos} ${n.unidos.length}/${n.cupos}
            ${!full && !joined ? `<button onclick="joinMatchRequest('${m.id}','${n.pos}')">UNIRME</button>` : ''}
            ${joined ? '✓' : ''}
          </div>`;
        }).join('')}
        ${m.estado === 'completo' ? '<span class="bp-tag-completo">EQUIPO COMPLETO</span>' : ''}
      </div>
    </div>
  `).join('');
}

/* ===== INVITACIONES (jugadores ya registrados en este dispositivo) ===== */

function loadInvites() {
  try { return JSON.parse(localStorage.getItem(INVITES_KEY)) || []; } catch { return []; }
}
function saveInvites() {
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
}

let invites = loadInvites();

function getMyInvites() {
  return invites.filter(i => i.toId === state.id);
}

function renderMyMatches() {
  const el = document.getElementById('my-matches');
  if (!el) return;
  if (!state) { el.innerHTML = guestPrompt('Inicia sesión para crear partidos e invitar jugadores.'); return; }
  const mine = openMatches.filter(m => m.creatorId === state.id);
  if (!mine.length) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = mine.map(m => {
    const myInvites = invites.filter(i => i.matchId === m.id);
    return `
      <div class="mm-card">
        <div class="mm-info">
          <div class="mm-zona">${m.zona}${m.cancha ? ' · ' + m.cancha : ''} — ${m.fecha}</div>
          <div>FÚTBOL ${m.formato} · ${m.superficie}</div>
          ${myInvites.length ? `<div class="mm-confirmados">${myInvites.map(i => `<span class="mm-confirm-chip ${i.status}">${i.toName} · ${i.status}</span>`).join('')}</div>` : ''}
        </div>
        <button class="mm-invite-btn" onclick="openInviteModal('${m.id}')">+ INVITAR JUGADORES</button>
      </div>
    `;
  }).join('');
}

function openInviteModal(matchId) {
  const match = openMatches.find(m => m.id === matchId);
  if (!match) return;
  const others = Object.values(profiles).filter(p => p.id !== state.id);
  const alreadyInvited = new Set(invites.filter(i => i.matchId === matchId).map(i => i.toId));
  const available = others.filter(p => !alreadyInvited.has(p.id));
  document.getElementById('invite-content').innerHTML = `
    <div class="invite-title">INVITAR JUGADORES</div>
    <div class="invite-sub">${match.zona} — ${match.fecha}. Por ahora solo puedes invitar perfiles creados en este mismo dispositivo. Cuando conectemos LEVEL UP a un servidor compartido podrás invitar a cualquier jugador real.</div>
    <div class="invite-list" id="invite-list">
      ${available.length
        ? available.map(p => `<label class="invite-row"><input type="checkbox" value="${p.id}"> ${p.nickname || p.name} (${p.position})</label>`).join('')
        : `<div class="invite-empty">No hay más perfiles disponibles para invitar en este dispositivo.</div>`}
    </div>
    <button class="invite-submit" onclick="submitInvites('${matchId}')">ENVIAR INVITACIONES</button>
    <button class="invite-cancel" onclick="closeInviteModal()">CANCELAR</button>
  `;
  document.getElementById('invite-modal').classList.add('open');
}

function closeInviteModal() {
  document.getElementById('invite-modal').classList.remove('open');
}

function submitInvites(matchId) {
  const match = openMatches.find(m => m.id === matchId);
  if (!match) return;
  const checked = document.querySelectorAll('#invite-list input[type=checkbox]:checked');
  checked.forEach(cb => {
    const toProfile = profiles[cb.value];
    if (!toProfile) return;
    invites.push({
      id: 'inv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      matchId,
      zona: match.zona,
      fecha: match.fecha,
      fromId: state.id,
      fromName: state.nickname || state.name,
      toId: toProfile.id,
      toName: toProfile.nickname || toProfile.name,
      status: 'pendiente',
    });
  });
  saveInvites();
  closeInviteModal();
  renderMyMatches();
}

function respondInvite(inviteId, accept) {
  const invite = invites.find(i => i.id === inviteId);
  if (!invite) return;
  invite.status = accept ? 'aceptada' : 'rechazada';
  saveInvites();
  const fromProfile = profiles[invite.fromId];
  if (fromProfile) {
    fromProfile.notifications.push({
      icon: accept ? '✅' : '❌',
      text: `${state.nickname || state.name} ${accept ? 'aceptó' : 'rechazó'} tu invitación al partido en ${invite.zona} — ${invite.fecha}.`,
      time: 'AHORA',
    });
    saveProfiles();
  }
  renderNotifications();
}

function renderTicker() {
  const items = [];
  openMatches.filter(m => m.estado === 'abierto').forEach(m => {
    m.necesita.filter(n => n.unidos.length < n.cupos).forEach(n => {
      items.push(`<span class="tk-item">🔍 <strong>SE BUSCA ${n.pos}</strong> Fútbol ${m.formato} · ${m.zona} · ${m.fecha} · faltan ${n.cupos - n.unidos.length}</span>`);
    });
  });
  Object.values(profiles).slice(-5).forEach(p => {
    items.push(`<span class="tk-item">🆕 <strong>NUEVO JUGADOR</strong> ${p.nickname || p.name} se unió a LEVEL UP</span>`);
  });
  if (items.length === 0) {
    items.push(`<span class="tk-item">⚽ Sé el primero en publicar tu búsqueda en "BUSCAR PARTIDO"</span>`);
  }
  const feed = items.concat(items).join('');
  const el = document.getElementById('ticker-inner');
  if (el) el.innerHTML = feed;
}

function initApp() {
  loadCurrentProfile();
  const page = getCurrentPage();
  const PUBLIC_PAGES = ['index.html', 'privacidad.html'];
  if (!state && !PUBLIC_PAGES.includes(page)) { location.href = 'index.html'; return; }
  if (state && page === 'index.html') { location.href = 'dashboard.html'; return; }

  renderAll();
  syncProfilesFromCloud();
  if (state) pushProfileToCloud(state);

  const fechaInput = document.getElementById('bp-fecha-date');
  if (fechaInput) fechaInput.min = new Date().toISOString().split('T')[0];

  if (location.hash === '#crear' && state) {
    const form = document.getElementById('bp-form');
    if (form) form.style.display = 'block';
  }
}

initApp();

/* ===== AUDIO ===== */

const aud = document.getElementById('audio');
let audPlaying = false;

function setAudioUI(playing) {
  const ctrl = document.getElementById('audio-ctrl');
  const lbl = document.getElementById('audio-lbl');
  ctrl.classList.toggle('muted', !playing);
  lbl.textContent = playing ? 'SILENCIAR' : "LET'S ROLL";
}

document.addEventListener('click', function startAudio() {
  aud.volume = 0.7;
  aud.play().then(() => {
    audPlaying = true;
    setAudioUI(true);
  }).catch(() => {});
  document.removeEventListener('click', startAudio);
}, { once: true });

function toggleAudio() {
  if (audPlaying) {
    aud.pause();
    audPlaying = false;
  } else {
    aud.play();
    audPlaying = true;
  }
  setAudioUI(audPlaying);
}

/* ===== HERO PARALLAX (sutil, reactivo al mouse) ===== */
(function () {
  const heroBg = document.getElementById('hero-bg');
  if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const img = heroBg.querySelector('.hero-bg-img');
  const smoke = heroBg.querySelector('.hero-bg-smoke');
  const light = heroBg.querySelector('.hero-bg-light');
  let tx = 0, ty = 0, cx = 0, cy = 0;

  window.addEventListener('mousemove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function tick() {
    cx += (tx - cx) * 0.05;
    cy += (ty - cy) * 0.05;
    if (img) img.style.transform = `scale(1.06) translate(${(cx * -6).toFixed(2)}px, ${(cy * -4).toFixed(2)}px)`;
    if (smoke) smoke.style.transform = `translate(${(cx * 10).toFixed(2)}px, ${(cy * 6).toFixed(2)}px)`;
    if (light) light.style.transform = `translate(${(cx * 4).toFixed(2)}px, ${(cy * 3).toFixed(2)}px)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
