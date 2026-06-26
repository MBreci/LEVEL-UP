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
    notif_seen_count: p.notifSeenCount || 0,
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
    notifSeenCount: r.notif_seen_count || 0,
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
    if (!state || row.id !== state.id) {
      profiles[row.id] = rowToProfile(row);
    } else {
      const cloudNotifs = row.notifications || [];
      const seen = new Set(state.notifications.map(n => n.icon + n.text + n.time));
      cloudNotifs.forEach(n => {
        const key = n.icon + n.text + n.time;
        if (!seen.has(key)) { state.notifications.push(n); seen.add(key); }
      });
      profiles[state.id] = state;
    }
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
    notifSeenCount: 0,
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
    <div class="fc-foot">
      <div class="fc-team">${p.team || 'SIN EQUIPO'}${(teams && Object.values(teams).some(t => t.captainId === p.id)) ? ' <span class="fc-captain-badge">⭐ CAPITÁN</span>' : ''}</div>
      ${buildPhysicalPillsHTML(p)}
    </div>
  `;
  return { className, html };
}

function buildPhysicalPillsHTML(p) {
  const ph = p.physical || {};
  const pill = (cls, label, val, unit) => `
    <div class="fc-phys-pill ${cls}${val == null ? ' empty' : ''}" title="${label}">
      <span class="fc-phys-l">${label}</span>
      <span class="fc-phys-v">${val == null ? '—' : val + (unit || '')}</span>
    </div>`;
  return `
    <div class="fc-phys-row">
      ${pill('cyan', 'PESO', ph.weight, 'KG')}
      ${pill('pink', 'ALT', ph.height, 'CM')}
      ${pill('orange', 'EDAD', ph.age, '')}
      ${pill('violet', 'PIE', ph.foot, '')}
    </div>`;
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
    <div class="pi-sub">${state.position} · ${state.team || 'SIN EQUIPO'}</div>
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
  const myTeamInvites = getMyTeamInvites();
  const myChallenges = getMyChallenges();
  const myLeaveRequests = getMyTeamLeaveRequests();
  const totalCount = state.notifications.length + myInvites.filter(i => i.status === 'pendiente').length + myTeamInvites.length + myChallenges.length + myLeaveRequests.length;
  if (getCurrentPage() === 'notificaciones.html' && totalCount !== (state.notifSeenCount || 0)) {
    state.notifSeenCount = totalCount;
    profiles[state.id] = state;
    saveProfiles();
    pushProfileToCloud(state);
  }
  if (countEl) countEl.textContent = Math.max(0, totalCount - (state.notifSeenCount || 0));
  const el = document.getElementById('notif-list');
  if (!el) return;
  if (!state.notifications.length && !myInvites.length && !myTeamInvites.length && !myChallenges.length && !myLeaveRequests.length) {
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
  const teamInviteRows = myTeamInvites.slice().reverse().map(inv => `
    <div class="notif-invite">
      <div class="notif-invite-txt">🛡️ <strong>${inv.teamName}</strong> te invitó a unirte como jugador.</div>
      <div class="notif-invite-actions">
        <button class="notif-accept" onclick="respondTeamInvite('${inv.id}',true)">ACEPTAR</button>
        <button class="notif-reject" onclick="respondTeamInvite('${inv.id}',false)">RECHAZAR</button>
      </div>
    </div>
  `).join('');
  const challengeRows = myChallenges.slice().reverse().map(c => {
    const fromTeam = teams[c.fromTeamId];
    return `
    <div class="notif-invite">
      <div class="notif-invite-txt">⚔️ <strong>${fromTeam ? fromTeam.name : 'Un equipo'}</strong> te retó a un partido en ${c.cancha} — ${c.fecha} ${c.hora}</div>
      <div class="notif-invite-actions">
        <button class="notif-accept" onclick="respondChallenge('${c.id}',true)">ACEPTAR</button>
        <button class="notif-reject" onclick="respondChallenge('${c.id}',false)">RECHAZAR</button>
      </div>
    </div>
  `;
  }).join('');
  const leaveRequestRows = myLeaveRequests.map(({ team, playerId }) => {
    const p = profiles[playerId];
    if (!p) return '';
    return `
    <div class="notif-invite">
      <div class="notif-invite-txt">🚪 <strong>${p.nickname || p.name}</strong> solicitó salir de ${team.name}.</div>
      <div class="notif-invite-actions">
        <button class="notif-accept" onclick="respondLeaveRequest('${team.id}','${playerId}',true)">ACEPTAR</button>
        <button class="notif-reject" onclick="respondLeaveRequest('${team.id}','${playerId}',false)">RECHAZAR</button>
      </div>
    </div>`;
  }).join('');
  const normalRows = state.notifications.slice().reverse().map(n => `
    <div class="notif-row">
      <div class="notif-icon">${n.icon}</div>
      <div><div class="notif-txt">${n.text}</div><div class="notif-time">${n.time}</div></div>
    </div>
  `).join('');
  el.innerHTML = inviteRows + teamInviteRows + challengeRows + leaveRequestRows + normalRows;
}

function getMyTeamLeaveRequests() {
  const team = getMyTeam();
  if (!team || !state || team.captainId !== state.id || !team.leaveRequests) return [];
  return team.leaveRequests.map(playerId => ({ team, playerId }));
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
  renderTeamsModule();
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

/* ===== EQUIPOS · REY DEL BARRIO · RETOS ===== */

const TEAMS_KEY = 'levelup_teams';
const TEAM_INVITES_KEY = 'levelup_team_invites';
const CHALLENGES_KEY = 'levelup_challenges';
const TEAM_MATCHES_KEY = 'levelup_team_matches';

function loadTeams() { try { return JSON.parse(localStorage.getItem(TEAMS_KEY)) || {}; } catch { return {}; } }
function saveTeams() { localStorage.setItem(TEAMS_KEY, JSON.stringify(teams)); }
let teams = loadTeams();

function loadTeamInvites() { try { return JSON.parse(localStorage.getItem(TEAM_INVITES_KEY)) || []; } catch { return []; } }
function saveTeamInvites() { localStorage.setItem(TEAM_INVITES_KEY, JSON.stringify(teamInvites)); }
let teamInvites = loadTeamInvites();

function teamInviteToRow(i) {
  return {
    id: i.id, team_id: i.teamId, team_name: i.teamName, from_captain_id: i.fromCaptainId,
    to_id: i.toId, status: i.status,
  };
}
function rowToTeamInvite(r) {
  return {
    id: r.id, teamId: r.team_id, teamName: r.team_name, fromCaptainId: r.from_captain_id,
    toId: r.to_id, status: r.status,
  };
}
async function pushTeamInviteToCloud(i) {
  if (!sb) return;
  const { error } = await sb.from('team_invites').upsert(teamInviteToRow(i));
  if (error) console.error('Error guardando invitación de equipo en la nube:', error.message);
}
async function syncTeamInvitesFromCloud() {
  if (!sb) return;
  const { data, error } = await sb.from('team_invites').select('*');
  if (error || !data) { console.error('Error sincronizando invitaciones de equipo:', error && error.message); return; }
  const localIds = new Set(teamInvites.map(i => i.id));
  data.forEach(row => {
    if (!localIds.has(row.id)) teamInvites.push(rowToTeamInvite(row));
    else Object.assign(teamInvites.find(i => i.id === row.id), rowToTeamInvite(row));
  });
  saveTeamInvites();
}

function loadChallenges() { try { return JSON.parse(localStorage.getItem(CHALLENGES_KEY)) || []; } catch { return []; } }
function saveChallenges() { localStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges)); }
let challenges = loadChallenges();

function loadTeamMatches() { try { return JSON.parse(localStorage.getItem(TEAM_MATCHES_KEY)) || []; } catch { return []; } }
function saveTeamMatches() { localStorage.setItem(TEAM_MATCHES_KEY, JSON.stringify(teamMatches)); }
let teamMatches = loadTeamMatches();

function teamToRow(t) {
  return {
    id: t.id, name: t.name, descripcion: t.desc, city: t.city, color: t.color, photo: t.photo,
    captain_id: t.captainId, member_ids: t.memberIds, open_for_players: t.openForPlayers,
    join_requests: t.joinRequests, wins: t.wins, draws: t.draws, losses: t.losses,
    goals_for: t.goalsFor, goals_against: t.goalsAgainst, streak: t.streak, created_at: t.createdAt,
    slot_positions: t.slotPositions, leave_requests: t.leaveRequests,
  };
}
function rowToTeam(r) {
  return {
    id: r.id, name: r.name, desc: r.descripcion, city: r.city, color: r.color, photo: r.photo,
    captainId: r.captain_id, memberIds: r.member_ids || [], openForPlayers: r.open_for_players,
    joinRequests: r.join_requests || [], wins: r.wins || 0, draws: r.draws || 0, losses: r.losses || 0,
    goalsFor: r.goals_for || 0, goalsAgainst: r.goals_against || 0, streak: r.streak || '', createdAt: r.created_at,
    slotPositions: r.slot_positions || [], leaveRequests: r.leave_requests || [],
  };
}
async function pushTeamToCloud(t) {
  if (!sb) return;
  const { error } = await sb.from('teams').upsert(teamToRow(t));
  if (error) console.error('Error guardando equipo en la nube:', error.message);
}
async function syncTeamsFromCloud() {
  if (!sb) return;
  const { data, error } = await sb.from('teams').select('*');
  if (error || !data) { console.error('Error sincronizando equipos:', error && error.message); return; }
  data.forEach(row => { teams[row.id] = rowToTeam(row); });
  saveTeams();
}

function challengeToRow(c) {
  return {
    id: c.id, from_team_id: c.fromTeamId, to_team_id: c.toTeamId, cancha: c.cancha, costo: c.costo,
    fecha: c.fecha, hora: c.hora, jugadores: c.jugadores, observaciones: c.observaciones,
    status: c.status, created_at: c.createdAt,
  };
}
function rowToChallenge(r) {
  return {
    id: r.id, fromTeamId: r.from_team_id, toTeamId: r.to_team_id, cancha: r.cancha, costo: r.costo,
    fecha: r.fecha, hora: r.hora, jugadores: r.jugadores, observaciones: r.observaciones,
    status: r.status, createdAt: r.created_at,
  };
}
async function pushChallengeToCloud(c) {
  if (!sb) return;
  const { error } = await sb.from('team_challenges').upsert(challengeToRow(c));
  if (error) console.error('Error guardando reto en la nube:', error.message);
}
async function syncChallengesFromCloud() {
  if (!sb) return;
  const { data, error } = await sb.from('team_challenges').select('*');
  if (error || !data) { console.error('Error sincronizando retos:', error && error.message); return; }
  const localIds = new Set(challenges.map(c => c.id));
  data.forEach(row => { if (!localIds.has(row.id)) challenges.push(rowToChallenge(row)); else Object.assign(challenges.find(c => c.id === row.id), rowToChallenge(row)); });
  saveChallenges();
}

function teamMatchToRow(m) {
  return {
    id: m.id, team_a_id: m.teamAId, team_b_id: m.teamBId, cancha: m.cancha, costo: m.costo,
    fecha: m.fecha, hora: m.hora, jugadores: m.jugadores, observaciones: m.observaciones,
    estado: m.estado, resultado: m.resultado, mvp_id: m.mvpId, created_at: m.createdAt,
  };
}
function rowToTeamMatch(r) {
  return {
    id: r.id, teamAId: r.team_a_id, teamBId: r.team_b_id, cancha: r.cancha, costo: r.costo,
    fecha: r.fecha, hora: r.hora, jugadores: r.jugadores, observaciones: r.observaciones,
    estado: r.estado, resultado: r.resultado, mvpId: r.mvp_id, createdAt: r.created_at,
  };
}
async function pushTeamMatchToCloud(m) {
  if (!sb) return;
  const { error } = await sb.from('team_matches').upsert(teamMatchToRow(m));
  if (error) console.error('Error guardando partido de equipos en la nube:', error.message);
}
async function syncTeamMatchesFromCloud() {
  if (!sb) return;
  const { data, error } = await sb.from('team_matches').select('*');
  if (error || !data) { console.error('Error sincronizando partidos de equipos:', error && error.message); return; }
  const localIds = new Set(teamMatches.map(m => m.id));
  data.forEach(row => { if (!localIds.has(row.id)) teamMatches.push(rowToTeamMatch(row)); else Object.assign(teamMatches.find(m => m.id === row.id), rowToTeamMatch(row)); });
  saveTeamMatches();
}

const CANCHAS_REGISTRADAS = [
  'Cancha El Salitre', 'Polideportivo Kennedy', 'Cancha Sintética Suba', 'Coliseo Teusaquillo',
  'Cancha Bosa Central', 'Estadio Barrio Olaya', 'Cancha El Tunal', 'Polideportivo Fontibón',
];

function getTeamOVR(team) {
  const members = team.memberIds.map(id => profiles[id]).filter(Boolean);
  if (!members.length) return 0;
  return Math.round(members.reduce((s, p) => s + (p.ovr || 60), 0) / members.length);
}

function getTeamRecord(team) {
  return { record: `${team.wins}-${team.draws}-${team.losses}`, dg: team.goalsFor - team.goalsAgainst };
}

function getMyTeam() {
  if (!state) return null;
  return Object.values(teams).find(t => t.memberIds.includes(state.id)) || null;
}

const POSITIONS = ['POR', 'DEF', 'MED', 'DEL'];

function makeTeam({ name, desc, city, color, photo, captainId }) {
  const captain = profiles[captainId];
  return {
    id: 'team_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: name.toUpperCase(), desc: desc || '', city: city || '', color: color || '#00f58c', photo: photo || null,
    captainId, memberIds: [captainId], openForPlayers: false, joinRequests: [],
    slotPositions: [captain ? captain.position : '', '', '', '', '', ''],
    wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, streak: '',
    createdAt: Date.now(), leaveRequests: [],
  };
}

function setSlotPosition(teamId, idx, pos) {
  const team = teams[teamId];
  if (!team || !state || team.captainId !== state.id) return;
  if (!team.slotPositions) team.slotPositions = ['', '', '', '', '', ''];
  team.slotPositions[idx] = pos;
  saveTeams();
  pushTeamToCloud(team);
  renderTeamProfile(teamId);
}

function containsProfanityImageName(name) {
  return containsProfanity(name || '');
}

async function submitCreateTeam() {
  const errorEl = document.getElementById('team-error');
  const name = document.getElementById('team-name').value.trim();
  const desc = document.getElementById('team-desc').value.trim();
  const city = document.getElementById('team-city').value.trim();
  const color = document.getElementById('team-color').value;
  const photoInput = document.getElementById('team-photo');
  if (!state) { openAuth(true); return; }
  if (getMyTeam()) { errorEl.textContent = 'Ya perteneces a un equipo en este dispositivo.'; return; }
  if (!name) { errorEl.textContent = 'Escribe el nombre del equipo.'; return; }
  if (containsProfanity(name) || containsProfanity(desc) || containsProfanity(city)) {
    errorEl.textContent = 'El nombre, descripción o ciudad contiene lenguaje ofensivo. Por favor elige otro.';
    return;
  }
  errorEl.textContent = '';
  let photo = null;
  if (photoInput && photoInput.files && photoInput.files[0]) {
    photo = await fileToDataUrl(photoInput.files[0]);
  }
  const team = makeTeam({ name, desc, city, color, photo, captainId: state.id });
  teams[team.id] = team;
  saveTeams();
  pushTeamToCloud(team);
  state.team = team.name;
  profiles[state.id] = state;
  saveProfiles();
  pushProfileToCloud(state);
  renderTeamsModule();
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function toggleOpenForPlayers(teamId) {
  const team = teams[teamId];
  if (!team || team.captainId !== state.id) return;
  team.openForPlayers = !team.openForPlayers;
  saveTeams();
  pushTeamToCloud(team);
  renderTeamsModule();
}

function searchPlayersToInvite(query, teamId) {
  const el = document.getElementById('team-invite-suggest');
  if (!el) return;
  const q = (query || '').trim().toLowerCase();
  if (!q) { el.innerHTML = ''; el.classList.remove('open'); return; }
  const team = teams[teamId];
  const list = Object.values(profiles)
    .filter(p => !team.memberIds.includes(p.id))
    .filter(p => p.name.toLowerCase().includes(q) || (p.nickname || '').toLowerCase().includes(q))
    .slice(0, 6);
  if (!list.length) { el.innerHTML = `<div class="pl-suggest-item">Sin resultados.</div>`; el.classList.add('open'); return; }
  el.innerHTML = list.map(p => {
    const rank = getRank(p.xp);
    return `
    <div class="pl-suggest-item team-invite-row" onclick="sendTeamInvite('${teamId}','${p.id}')">
      <span>${p.nickname || p.name} <span class="s-sub">OVR ${p.ovr} · ${rank.name}</span></span>
      <span class="notif-accept" style="padding:6px 12px;font-size:10px">INVITAR</span>
    </div>`;
  }).join('');
  el.classList.add('open');
}

function sendTeamInvite(teamId, playerId) {
  const team = teams[teamId];
  const player = profiles[playerId];
  if (!team || !player) return;
  if (team.memberIds.length >= 6) { alert('Tu equipo ya tiene los 6 cupos llenos.'); return; }
  const exists = teamInvites.find(i => i.teamId === teamId && i.toId === playerId && i.status === 'pendiente');
  if (exists) { pushTeamInviteToCloud(exists); alert('Ya le habías enviado una invitación a este jugador. La reenviamos por si no había llegado.'); return; }
  const invite = {
    id: 'tinv_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    teamId, teamName: team.name, fromCaptainId: state.id, toId: playerId, status: 'pendiente',
  };
  teamInvites.push(invite);
  saveTeamInvites();
  pushTeamInviteToCloud(invite);
  player.notifications.push({ icon: '🛡️', text: `${team.name} te invitó a unirte como jugador. Capitán: ${state.nickname || state.name}.`, time: 'AHORA' });
  profiles[playerId] = player;
  saveProfiles();
  pushProfileToCloud(player);
  document.getElementById('team-invite-search').value = '';
  document.getElementById('team-invite-suggest').classList.remove('open');
  renderTeamsModule();
}

function getMyTeamInvites() {
  if (!state) return [];
  return teamInvites.filter(i => i.toId === state.id && i.status === 'pendiente');
}

function respondTeamInvite(inviteId, accept) {
  const invite = teamInvites.find(i => i.id === inviteId);
  if (!invite) return;
  invite.status = accept ? 'aceptada' : 'rechazada';
  saveTeamInvites();
  pushTeamInviteToCloud(invite);
  const team = teams[invite.teamId];
  if (accept && team && !team.memberIds.includes(state.id) && team.memberIds.length < 6) {
    team.memberIds.push(state.id);
    saveTeams();
    pushTeamToCloud(team);
    state.team = team.name;
    profiles[state.id] = state;
    saveProfiles();
    pushProfileToCloud(state);
  }
  const captain = profiles[invite.fromCaptainId];
  if (captain) {
    captain.notifications.push({ icon: accept ? '✅' : '❌', text: `${state.nickname || state.name} ${accept ? 'aceptó' : 'rechazó'} tu invitación a ${invite.teamName}.`, time: 'AHORA' });
    saveProfiles();
    pushProfileToCloud(captain);
  }
  renderAll();
}

function requestJoinTeam(teamId) {
  const team = teams[teamId];
  if (!team || !state) return;
  if (team.memberIds.includes(state.id)) return;
  if (team.joinRequests.includes(state.id)) return;
  team.joinRequests.push(state.id);
  saveTeams();
  pushTeamToCloud(team);
  const captain = profiles[team.captainId];
  if (captain) {
    captain.notifications.push({ icon: '🙋', text: `${state.nickname || state.name} solicitó unirse a ${team.name}.`, time: 'AHORA' });
    saveProfiles();
    pushProfileToCloud(captain);
  }
  alert('Solicitud enviada al capitán de ' + team.name + '.');
}

function respondJoinRequest(teamId, playerId, accept) {
  const team = teams[teamId];
  if (!team || team.captainId !== state.id) return;
  team.joinRequests = team.joinRequests.filter(id => id !== playerId);
  if (accept && team.memberIds.length < 6 && !team.memberIds.includes(playerId)) {
    team.memberIds.push(playerId);
  }
  saveTeams();
  pushTeamToCloud(team);
  const player = profiles[playerId];
  if (player) {
    player.notifications.push({ icon: accept ? '✅' : '❌', text: `Tu solicitud para unirte a ${team.name} fue ${accept ? 'aceptada' : 'rechazada'}.`, time: 'AHORA' });
    if (accept) player.team = team.name;
    profiles[playerId] = player;
    saveProfiles();
    pushProfileToCloud(player);
    if (state && state.id === playerId) state.team = player.team;
  }
  renderTeamProfile(teamId);
}

function requestLeaveTeam() {
  if (!state) return;
  const team = getMyTeam();
  if (!team) return;
  if (team.captainId === state.id) {
    alert('Eres el capitán de ' + team.name + '. Para salir primero debes transferir la capitanía o disolver el equipo (próximamente).');
    return;
  }
  if (!team.leaveRequests) team.leaveRequests = [];
  if (team.leaveRequests.includes(state.id)) { alert('Ya enviaste una solicitud para salir de este equipo.'); return; }
  team.leaveRequests.push(state.id);
  saveTeams();
  pushTeamToCloud(team);
  const captain = profiles[team.captainId];
  if (captain) {
    captain.notifications.push({ icon: '🚪', text: `${state.nickname || state.name} solicitó salir de ${team.name}.`, time: 'AHORA' });
    saveProfiles();
    pushProfileToCloud(captain);
  }
  alert('Solicitud de salida enviada al capitán de ' + team.name + '.');
  renderTeamProfile(team.id);
}

function respondLeaveRequest(teamId, playerId, accept) {
  const team = teams[teamId];
  if (!team || !state || team.captainId !== state.id) return;
  if (!team.leaveRequests) team.leaveRequests = [];
  team.leaveRequests = team.leaveRequests.filter(id => id !== playerId);
  if (accept) {
    team.memberIds = team.memberIds.filter(id => id !== playerId);
  }
  saveTeams();
  pushTeamToCloud(team);
  const player = profiles[playerId];
  if (player) {
    player.notifications.push({ icon: accept ? '✅' : '❌', text: `Tu solicitud para salir de ${team.name} fue ${accept ? 'aceptada' : 'rechazada'}.`, time: 'AHORA' });
    if (accept) {
      player.team = 'SIN EQUIPO';
      if (state && state.id === playerId) state.team = player.team;
    }
    profiles[playerId] = player;
    saveProfiles();
    pushProfileToCloud(player);
  }
  renderTeamProfile(teamId);
}

let kickTeamModalCtx = null;

function openKickModal(teamId, playerId) {
  const team = teams[teamId];
  const player = profiles[playerId];
  if (!team || !player || !state || state.id !== team.captainId) return;
  kickTeamModalCtx = { teamId, playerId };
  const textEl = document.getElementById('kick-modal-text');
  if (textEl) textEl.textContent = `Estás por echar a ${player.nickname || player.name} de tu equipo. Esto puede tener consecuencias para tu equipo y los demás jugadores. ¿Deseas continuar?`;
  const modal = document.getElementById('kick-modal');
  if (modal) modal.classList.add('open');
}

function closeKickModal() {
  kickTeamModalCtx = null;
  const modal = document.getElementById('kick-modal');
  if (modal) modal.classList.remove('open');
}

function confirmKickTeamMember() {
  if (!kickTeamModalCtx) return;
  const { teamId, playerId } = kickTeamModalCtx;
  closeKickModal();
  kickTeamMember(teamId, playerId);
}

function openEditTeamModal(teamId) {
  const team = teams[teamId];
  if (!team || !state || team.captainId !== state.id) return;
  document.getElementById('edit-team-id').value = team.id;
  document.getElementById('edit-team-name').value = team.name;
  document.getElementById('edit-team-desc').value = team.desc || '';
  document.getElementById('edit-team-city').value = team.city || '';
  document.getElementById('edit-team-color').value = team.color || '#00ff88';
  document.getElementById('edit-team-error').textContent = '';
  const preview = document.getElementById('edit-team-photo-preview');
  document.getElementById('edit-team-photo').value = '';
  if (team.photo) { preview.src = team.photo; preview.style.display = 'block'; }
  else preview.style.display = 'none';
  document.getElementById('edit-team-modal').classList.add('open');
}

function closeEditTeamModal() {
  document.getElementById('edit-team-modal').classList.remove('open');
}

async function previewEditTeamPhoto(input) {
  const img = document.getElementById('edit-team-photo-preview');
  if (!img) return;
  if (!input.files || !input.files[0]) return;
  img.src = await fileToDataUrl(input.files[0]);
  img.style.display = 'block';
}

async function submitEditTeam() {
  const errorEl = document.getElementById('edit-team-error');
  const teamId = document.getElementById('edit-team-id').value;
  const team = teams[teamId];
  if (!team || !state || team.captainId !== state.id) return;
  const name = document.getElementById('edit-team-name').value.trim();
  const desc = document.getElementById('edit-team-desc').value.trim();
  const city = document.getElementById('edit-team-city').value.trim();
  const color = document.getElementById('edit-team-color').value;
  const photoInput = document.getElementById('edit-team-photo');
  if (!name) { errorEl.textContent = 'Escribe el nombre del equipo.'; return; }
  if (containsProfanity(name) || containsProfanity(desc) || containsProfanity(city)) {
    errorEl.textContent = 'El nombre, descripción o ciudad contiene lenguaje ofensivo. Por favor elige otro.';
    return;
  }
  errorEl.textContent = '';
  if (photoInput && photoInput.files && photoInput.files[0]) {
    team.photo = await fileToDataUrl(photoInput.files[0]);
  }
  team.name = name.toUpperCase();
  team.desc = desc;
  team.city = city;
  team.color = color;
  saveTeams();
  pushTeamToCloud(team);
  if (state.team) {
    state.team = team.name;
    profiles[state.id] = state;
    saveProfiles();
    pushProfileToCloud(state);
  }
  closeEditTeamModal();
  renderTeamProfile(teamId);
}

function kickTeamMember(teamId, playerId) {
  const team = teams[teamId];
  if (!team || !state || state.id !== team.captainId) return;
  if (playerId === team.captainId) return;
  if (!team.memberIds.includes(playerId)) return;
  team.memberIds = team.memberIds.filter(id => id !== playerId);
  saveTeams();
  pushTeamToCloud(team);
  const player = profiles[playerId];
  if (player) {
    player.team = 'SIN EQUIPO';
    player.notifications.push({ icon: '🚪', text: `Fuiste retirado del equipo ${team.name} por el capitán.`, time: 'AHORA' });
    profiles[playerId] = player;
    saveProfiles();
    pushProfileToCloud(player);
    if (state && state.id === playerId) state.team = player.team;
  }
  renderTeamProfile(teamId);
}

function searchTeams(query) {
  const q = (query || '').trim().toLowerCase();
  return Object.values(teams)
    .filter(t => !q || t.name.toLowerCase().includes(q) || (t.city || '').toLowerCase().includes(q))
    .sort((a, b) => getTeamOVR(b) - getTeamOVR(a) || a.name.localeCompare(b.name));
}

function sendChallenge() {
  const errorEl = document.getElementById('challenge-error');
  const toTeamId = document.getElementById('challenge-to-team').value;
  const cancha = document.getElementById('challenge-cancha').value;
  const costo = document.getElementById('challenge-costo').value.trim();
  const fecha = document.getElementById('challenge-fecha').value;
  const hora = document.getElementById('challenge-hora').value;
  const jugadores = document.getElementById('challenge-jugadores').value;
  const observaciones = document.getElementById('challenge-obs').value.trim();
  const myTeam = getMyTeam();
  if (!myTeam || myTeam.captainId !== state.id) { errorEl.textContent = 'Solo el capitán puede retar a otro equipo.'; return; }
  if (!fecha || !hora) { errorEl.textContent = 'Escoge fecha y hora para el reto.'; return; }
  errorEl.textContent = '';
  const challenge = {
    id: 'ch_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    fromTeamId: myTeam.id, toTeamId, cancha, costo, fecha, hora, jugadores, observaciones,
    status: 'pendiente', createdAt: Date.now(),
  };
  challenges.push(challenge);
  saveChallenges();
  pushChallengeToCloud(challenge);
  const toTeam = teams[toTeamId];
  const captain = toTeam && profiles[toTeam.captainId];
  if (captain) {
    captain.notifications.push({ icon: '⚔️', text: `${myTeam.name} te retó a un partido en ${cancha} — ${fecha} ${hora}.`, time: 'AHORA' });
    saveProfiles();
    pushProfileToCloud(captain);
  }
  closeChallengeModal();
  alert('Reto enviado al capitán de ' + (toTeam ? toTeam.name : 'equipo rival') + '.');
}

function getMyChallenges() {
  const myTeam = getMyTeam();
  if (!myTeam || !state || myTeam.captainId !== state.id) return [];
  return challenges.filter(c => c.toTeamId === myTeam.id && c.status === 'pendiente');
}

function respondChallenge(challengeId, accept) {
  const challenge = challenges.find(c => c.id === challengeId);
  if (!challenge) return;
  challenge.status = accept ? 'aceptado' : 'rechazado';
  saveChallenges();
  pushChallengeToCloud(challenge);
  const fromTeam = teams[challenge.fromTeamId];
  const toTeam = teams[challenge.toTeamId];
  if (accept && fromTeam && toTeam) {
    const match = {
      id: 'tm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      teamAId: fromTeam.id, teamBId: toTeam.id, cancha: challenge.cancha, costo: challenge.costo,
      fecha: challenge.fecha, hora: challenge.hora, jugadores: challenge.jugadores, observaciones: challenge.observaciones,
      estado: 'programado', resultado: null, mvpId: null, createdAt: Date.now(),
    };
    teamMatches.push(match);
    saveTeamMatches();
    pushTeamMatchToCloud(match);
  }
  const captain = fromTeam && profiles[fromTeam.captainId];
  if (captain) {
    captain.notifications.push({ icon: accept ? '✅' : '❌', text: `${toTeam ? toTeam.name : 'El equipo rival'} ${accept ? 'aceptó' : 'rechazó'} tu reto.`, time: 'AHORA' });
    saveProfiles();
    pushProfileToCloud(captain);
  }
  renderAll();
}

function finalizeTeamMatch(matchId) {
  const match = teamMatches.find(m => m.id === matchId);
  if (!match) return;
  const teamA = teams[match.teamAId];
  const teamB = teams[match.teamBId];
  if (!teamA || !teamB || teamA.captainId !== state.id) return;
  const golesA = parseInt(prompt('Goles de ' + teamA.name + ':', '0'), 10) || 0;
  const golesB = parseInt(prompt('Goles de ' + teamB.name + ':', '0'), 10) || 0;
  match.resultado = { golesA, golesB };
  match.estado = 'finalizado';
  teamA.goalsFor += golesA; teamA.goalsAgainst += golesB;
  teamB.goalsFor += golesB; teamB.goalsAgainst += golesA;
  if (golesA > golesB) { teamA.wins++; teamB.losses++; }
  else if (golesA < golesB) { teamB.wins++; teamA.losses++; }
  else { teamA.draws++; teamB.draws++; }
  saveTeamMatches(); saveTeams();
  pushTeamMatchToCloud(match); pushTeamToCloud(teamA); pushTeamToCloud(teamB);
  renderTeamsModule();
}

function getTeamMatches(teamId, estado) {
  return teamMatches.filter(m => (m.teamAId === teamId || m.teamBId === teamId) && m.estado === estado)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function switchEquiposTab(tab) {
  ['crear', 'rey', 'programados'].forEach(t => {
    document.getElementById('eq-tab-' + t).classList.toggle('on', t === tab);
    document.getElementById('eq-panel-' + t).style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'rey') renderTeamSearch(document.getElementById('team-search') ? document.getElementById('team-search').value : '');
  if (tab === 'programados') renderTeamMatchesPanel();
}

function renderTeamsModule() {
  if (!document.getElementById('team-profile-content')) return;
  if (!state) {
    document.getElementById('team-create-panel').innerHTML = guestPrompt('Inicia sesión para crear o gestionar tu equipo.');
    document.getElementById('team-profile-content').innerHTML = '';
    renderTeamSearch(document.getElementById('team-search') ? document.getElementById('team-search').value : '');
    renderTeamMatchesPanel();
    return;
  }
  const myTeam = getMyTeam();
  const createPanel = document.getElementById('team-create-panel');
  if (createPanel) createPanel.style.display = myTeam ? 'none' : 'block';
  if (myTeam) {
    renderTeamProfile(myTeam.id);
  } else {
    document.getElementById('team-profile-content').innerHTML = '';
  }
  renderTeamSearch(document.getElementById('team-search') ? document.getElementById('team-search').value : '');
  renderTeamMatchesPanel();

  if (location.hash === '#rey') switchEquiposTab('rey');
  else if (location.hash === '#programados') switchEquiposTab('programados');
}

async function previewTeamPhoto(input) {
  const img = document.getElementById('team-photo-preview');
  if (!img) return;
  if (!input.files || !input.files[0]) { img.style.display = 'none'; return; }
  img.src = await fileToDataUrl(input.files[0]);
  img.style.display = 'block';
}

function openEscudoLightbox(src) {
  if (!src) return;
  const modal = document.getElementById('escudo-lightbox');
  const img = document.getElementById('escudo-lightbox-img');
  if (!modal || !img) return;
  img.src = src;
  modal.classList.add('open');
}
function closeEscudoLightbox() {
  const modal = document.getElementById('escudo-lightbox');
  if (modal) modal.classList.remove('open');
}

function renderTeamProfile(teamId) {
  const el = document.getElementById('team-profile-content');
  if (!el) return;
  const team = teams[teamId];
  if (!team) { el.innerHTML = `<div class="rk-empty">No se pudo cargar este equipo.</div>`; return; }
  const ovr = getTeamOVR(team);
  const { record, dg } = getTeamRecord(team);
  const captain = profiles[team.captainId];
  const isCaptain = state && state.id === team.captainId;
  const slotPositions = team.slotPositions || [];
  const positionSelect = (i, current) => `
    <select class="auth-input team-slot-pos-select" onchange="setSlotPosition('${team.id}',${i},this.value)">
      <option value="" ${!current ? 'selected' : ''}>POSICIÓN...</option>
      ${POSITIONS.map(pos => `<option value="${pos}" ${current === pos ? 'selected' : ''}>${pos}</option>`).join('')}
    </select>`;
  const slots = Array.from({ length: 6 }, (_, i) => {
    const memberId = team.memberIds[i];
    const pos = slotPositions[i] || '';
    if (!memberId) {
      return isCaptain
        ? `<div class="team-slot empty">
            ${positionSelect(i, pos)}
            <input class="auth-input team-invite-input" id="team-invite-search" placeholder="Buscar jugador para invitar..." autocomplete="off" oninput="searchPlayersToInvite(this.value,'${team.id}')" onblur="setTimeout(()=>document.getElementById('team-invite-suggest').classList.remove('open'),150)">
            <div class="pl-suggest" id="team-invite-suggest"></div>
          </div>`
        : `<div class="team-slot empty">${pos ? `<div class="team-slot-tag">${pos}</div>` : ''}<span class="team-slot-empty-txt">CUPO LIBRE</span></div>`;
    }
    const p = profiles[memberId];
    if (!p) return `<div class="team-slot empty"><span class="team-slot-empty-txt">CUPO LIBRE</span></div>`;
    const isCap = memberId === team.captainId;
    const neonIdx = i % 6;
    return `
      <div class="team-slot team-slot-neon neon-${neonIdx} ${isCap ? 'captain' : ''}">
        <div class="team-slot-smoke"></div>
        <div class="team-slot-photo-wrap" onclick="openPlayerView('${p.id}')" title="Ver ficha de ${p.nickname || p.name}">
          ${p.photo ? `<img class="team-slot-photo" src="${p.photo}">` : `<div class="team-slot-av">${p.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>`}
        </div>
        <div class="team-slot-name">${p.nickname || p.name}</div>
        <div class="team-slot-ovr">OVR ${p.ovr}</div>
        ${isCaptain ? positionSelect(i, pos) : (pos ? `<div class="team-slot-tag">${pos}</div>` : '')}
        ${isCap ? '<div class="team-slot-captain-badge">CAPITÁN</div>' : ''}
        ${isCaptain && !isCap ? `<button class="mm-invite-btn team-kick-btn" onclick="openKickModal('${team.id}','${p.id}')">ECHAR DEL EQUIPO</button>` : ''}
      </div>`;
  }).join('');
  const requests = isCaptain && team.joinRequests.length
    ? `<div class="sec-hdr"><div class="sec-eyebrow">SOLICITUDES PARA UNIRSE</div></div>
       <div class="team-requests">
        ${team.joinRequests.map(pid => {
          const p = profiles[pid];
          if (!p) return '';
          return `<div class="notif-invite">
            <div class="notif-invite-txt">🙋 <strong>${p.nickname || p.name}</strong> · OVR ${p.ovr} · ${p.position}</div>
            <div class="notif-invite-actions">
              <button class="notif-accept" onclick="respondJoinRequest('${team.id}','${pid}',true)">ACEPTAR</button>
              <button class="notif-reject" onclick="respondJoinRequest('${team.id}','${pid}',false)">RECHAZAR</button>
            </div>
          </div>`;
        }).join('')}
       </div>`
    : '';
  const leaveRequests = team.leaveRequests || [];
  const leaveRequestsSection = isCaptain && leaveRequests.length
    ? `<div class="sec-hdr"><div class="sec-eyebrow">SOLICITUDES PARA SALIR DEL EQUIPO</div></div>
       <div class="team-requests">
        ${leaveRequests.map(pid => {
          const p = profiles[pid];
          if (!p) return '';
          return `<div class="notif-invite">
            <div class="notif-invite-txt">🚪 <strong>${p.nickname || p.name}</strong> quiere salir del equipo.</div>
            <div class="notif-invite-actions">
              <button class="notif-accept" onclick="respondLeaveRequest('${team.id}','${pid}',true)">ACEPTAR</button>
              <button class="notif-reject" onclick="respondLeaveRequest('${team.id}','${pid}',false)">RECHAZAR</button>
            </div>
          </div>`;
        }).join('')}
       </div>`
    : '';
  const isNonCaptainMember = state && !isCaptain && team.memberIds.includes(state.id);
  const alreadyRequestedLeave = state && leaveRequests.includes(state.id);
  const leaveBtn = isNonCaptainMember
    ? `<button class="mm-invite-btn team-leave-btn" onclick="requestLeaveTeam()" ${alreadyRequestedLeave ? 'disabled' : ''}>${alreadyRequestedLeave ? 'SOLICITUD DE SALIDA ENVIADA' : 'SOLICITAR SALIR DEL EQUIPO'}</button>`
    : '';
  el.innerHTML = `
    <div class="team-card">
      <div class="team-card-head">
        ${team.photo ? `<img class="team-escudo escudo-clickable" src="${team.photo}" onclick="openEscudoLightbox('${team.photo}')">` : `<div class="team-escudo team-escudo-placeholder" style="background:${team.color}">${team.name.slice(0, 2)}</div>`}
        <div>
          <div class="team-card-name">${team.name}</div>
          <div class="team-card-sub">${team.city || 'SIN CIUDAD'} ${team.desc ? '· ' + team.desc : ''}</div>
          <div class="pi-tags">
            <div class="pi-tag g">OVR ${ovr}</div>
            <div class="pi-tag gold">RÉCORD ${record}</div>
            <div class="pi-tag g">DIF. GOLES ${dg >= 0 ? '+' : ''}${dg}</div>
          </div>
          <div class="team-card-captain">Capitán: ${captain ? (captain.nickname || captain.name) : 'DESCONOCIDO'}</div>
        </div>
        ${isCaptain ? `<button class="mm-invite-btn team-edit-btn" onclick="openEditTeamModal('${team.id}')">✎ EDITAR EQUIPO</button>` : ''}
      </div>
      ${isCaptain ? `<button class="mm-invite-btn" onclick="toggleOpenForPlayers('${team.id}')">${team.openForPlayers ? '✓ ABIERTO A SOLICITUDES' : 'CERRADO A SOLICITUDES — ABRIR'}</button>` : ''}
      ${leaveBtn}
      <div class="team-slots">${slots}</div>
    </div>
    ${requests}
    ${leaveRequestsSection}
  `;
}

function closeTeamSuggestions() {
  const box = document.getElementById('team-suggest');
  if (box) box.classList.remove('open');
}

function renderTeamSuggestions(query) {
  const box = document.getElementById('team-suggest');
  if (!box) return;
  const q = (query || '').trim().toLowerCase();
  if (!q) { box.classList.remove('open'); box.innerHTML = ''; return; }
  const list = searchTeams(query).slice(0, 6);
  if (!list.length) { box.classList.remove('open'); box.innerHTML = ''; return; }
  box.innerHTML = list.map(t => `
    <div class="pl-suggest-item" onclick="openTeamView('${t.id}')">
      <span>${t.name}</span>
      <span class="s-sub">${t.city || ''} · OVR ${getTeamOVR(t)}</span>
    </div>`).join('');
  box.classList.add('open');
}

function renderTeamSearch(query) {
  const el = document.getElementById('team-grid');
  if (!el) return;
  const list = searchTeams(query);
  if (!list.length) {
    el.innerHTML = `<div class="rk-empty">No se encontraron equipos. ¡Sé el primero en crear uno!</div>`;
    renderTeamSuggestions(query);
    return;
  }
  el.innerHTML = list.map(t => {
    const ovr = getTeamOVR(t);
    const { record } = getTeamRecord(t);
    return `
    <div class="pl-card" onclick="openTeamView('${t.id}')">
      ${t.photo ? `<img class="pl-card-av team-card-av-img" src="${t.photo}">` : `<div class="pl-card-av" style="background:${t.color}">${t.name.slice(0, 2)}</div>`}
      <div class="pl-card-name">${t.name}</div>
      <div class="pl-card-sub">${t.city || 'SIN CIUDAD'} · ${t.memberIds.length}/6 JUGADORES</div>
      <div class="pl-card-tags"><span class="pi-tag g">OVR ${ovr}</span><span class="pi-tag gold">${record}</span></div>
    </div>`;
  }).join('');
  renderTeamSuggestions(query);
}

function openTeamView(teamId) {
  const team = teams[teamId];
  const modal = document.getElementById('team-view-modal');
  const content = document.getElementById('team-view-content');
  if (!modal || !content) return;
  if (!team) {
    content.innerHTML = `<div class="rk-empty">No se pudo cargar este equipo.</div>`;
    modal.classList.add('open');
    return;
  }
  const ovr = getTeamOVR(team);
  const { record, dg } = getTeamRecord(team);
  const captain = profiles[team.captainId];
  const members = team.memberIds.map(id => profiles[id]).filter(Boolean);
  const recentMatches = teamMatches.filter(m => (m.teamAId === teamId || m.teamBId === teamId) && m.estado === 'finalizado')
    .sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const isMine = !!(getMyTeam() && getMyTeam().id === teamId);
  const alreadyMember = state && team.memberIds.includes(state.id);
  const alreadyRequested = state && team.joinRequests.includes(state.id);
  content.innerHTML = `
    <div class="team-card">
      <div class="team-card-head">
        ${team.photo ? `<img class="team-escudo escudo-clickable" src="${team.photo}" onclick="openEscudoLightbox('${team.photo}')">` : `<div class="team-escudo team-escudo-placeholder" style="background:${team.color}">${team.name.slice(0, 2)}</div>`}
        <div>
          <div class="team-card-name">${team.name}</div>
          <div class="team-card-sub">${team.city || 'SIN CIUDAD'} ${team.desc ? '· ' + team.desc : ''}</div>
          <div class="pi-tags">
            <div class="pi-tag g">OVR ${ovr}</div>
            <div class="pi-tag gold">RÉCORD ${record}</div>
            <div class="pi-tag g">DIF. GOLES ${dg >= 0 ? '+' : ''}${dg}</div>
          </div>
          <div class="team-card-captain">Capitán: ${captain ? (captain.nickname || captain.name) : 'DESCONOCIDO'}</div>
        </div>
      </div>
      <div class="team-slots">
        ${members.map(p => `
          <div class="team-slot ${p.id === team.captainId ? 'captain' : ''}">
            ${p.photo ? `<img class="team-slot-photo" src="${p.photo}">` : `<div class="team-slot-av">${p.name.split(' ').map(s => s[0]).join('').slice(0, 2)}</div>`}
            <div class="team-slot-name">${p.nickname || p.name}</div>
            <div class="team-slot-ovr">OVR ${p.ovr}</div>
            ${p.id === team.captainId ? '<div class="team-slot-tag">CAPITÁN</div>' : ''}
          </div>`).join('')}
      </div>
      ${recentMatches.length ? `
        <div class="sec-hdr"><div class="sec-eyebrow">PARTIDOS RECIENTES</div></div>
        <div class="team-hist-list">
          ${recentMatches.map(m => `
            <div class="team-hist-row">
              <span>${m.fecha} ${m.hora || ''}</span>
              <span>${m.resultado ? m.resultado.golesA + '-' + m.resultado.golesB : '—'}</span>
            </div>`).join('')}
        </div>` : ''}
      ${isMine ? '' : state
        ? `<button class="auth-submit" onclick="closeTeamView();openChallengeModal('${team.id}')">RETAR EQUIPO</button>`
        : ''}
      ${!isMine && !alreadyMember && !getMyTeam() && team.openForPlayers
        ? `<button class="mm-invite-btn" onclick="requestJoinTeam('${team.id}')" ${alreadyRequested ? 'disabled' : ''}>${alreadyRequested ? 'SOLICITUD ENVIADA' : '+ SOLICITAR UNIRME'}</button>`
        : ''}
    </div>
  `;
  modal.classList.add('open');
}

function closeTeamView() {
  const modal = document.getElementById('team-view-modal');
  if (modal) modal.classList.remove('open');
}

function openChallengeModal(teamId) {
  if (!state) { openAuth(true); return; }
  const myTeam = getMyTeam();
  if (!myTeam || myTeam.captainId !== state.id) { alert('Solo el capitán de un equipo puede enviar retos.'); return; }
  document.getElementById('challenge-to-team').value = teamId;
  document.getElementById('challenge-error').textContent = '';
  const canchaSel = document.getElementById('challenge-cancha');
  canchaSel.innerHTML = CANCHAS_REGISTRADAS.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('challenge-modal').classList.add('open');
}

function closeChallengeModal() {
  document.getElementById('challenge-modal').classList.remove('open');
}

function renderTeamMatchesPanel() {
  const el = document.getElementById('team-matches-content');
  if (!el) return;
  if (!state) { el.innerHTML = guestPrompt('Inicia sesión para ver tus partidos programados.'); return; }
  const myTeam = getMyTeam();
  if (!myTeam) { el.innerHTML = `<div class="rk-empty">Aún no tienes equipo. Crea uno en "CREAR EQUIPO / MI EQUIPO".</div>`; return; }
  const programados = getTeamMatches(myTeam.id, 'programado');
  const finalizados = getTeamMatches(myTeam.id, 'finalizado');
  const isCaptain = myTeam.captainId === state.id;
  const row = (m, finalized) => {
    const rivalId = m.teamAId === myTeam.id ? m.teamBId : m.teamAId;
    const rival = teams[rivalId];
    const canFinalize = !finalized && isCaptain && m.teamAId === myTeam.id;
    return `
      <div class="team-hist-row">
        <span>${m.fecha} ${m.hora || ''} · ${m.cancha}</span>
        <span>VS ${rival ? rival.name : 'EQUIPO RIVAL'}</span>
        <span>${finalized && m.resultado ? m.resultado.golesA + '-' + m.resultado.golesB : (finalized ? '—' : 'PROGRAMADO')}</span>
        ${canFinalize ? `<button class="mm-invite-btn" onclick="finalizeTeamMatch('${m.id}')">FINALIZAR PARTIDO</button>` : ''}
      </div>`;
  };
  el.innerHTML = `
    <div class="sec-hdr"><div class="sec-eyebrow">PARTIDOS PROGRAMADOS</div></div>
    <div class="team-hist-list">
      ${programados.length ? programados.map(m => row(m, false)).join('') : `<div class="rk-empty">No tienes partidos programados.</div>`}
    </div>
    <div class="sec-hdr"><div class="sec-eyebrow">HISTORIAL</div></div>
    <div class="team-hist-list">
      ${finalizados.length ? finalizados.map(m => row(m, true)).join('') : `<div class="rk-empty">Aún no has finalizado partidos de equipo.</div>`}
    </div>
  `;
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
  Object.values(teams).sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).forEach(t => {
    items.push(`<span class="tk-item">🛡️ <strong>NUEVO EQUIPO</strong> ${t.name} se formó en LEVEL UP</span>`);
  });
  teamInvites.filter(i => i.status === 'aceptada').slice(-5).forEach(i => {
    const p = profiles[i.toId];
    if (p) items.push(`<span class="tk-item">🤝 <strong>NUEVO FICHAJE</strong> ${p.nickname || p.name} se unió a ${i.teamName}</span>`);
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

  if (state && (state.nickname === 'Lobo' || state.name === 'Miguel Breci') && (!state.physical || state.physical.weight == null)) {
    state.physical = Object.assign({}, state.physical, { weight: 85, height: 180, foot: 'DERECHO' });
    profiles[state.id] = state;
    saveProfiles();
    pushProfileToCloud(state);
  }

  renderAll();
  syncProfilesFromCloud();
  syncTeamsFromCloud().then(() => {
    const myTeam = getMyTeam();
    if (myTeam) {
      pushTeamToCloud(myTeam);
      if (state.team !== myTeam.name) {
        state.team = myTeam.name;
        profiles[state.id] = state;
        saveProfiles();
        pushProfileToCloud(state);
      }
    }
    renderAll();
  });
  syncTeamInvitesFromCloud().then(renderAll);
  syncChallengesFromCloud();
  syncTeamMatchesFromCloud();
  if (state) pushProfileToCloud(state);

  const fechaInput = document.getElementById('bp-fecha-date');
  if (fechaInput) fechaInput.min = new Date().toISOString().split('T')[0];

  if (location.hash === '#crear' && state) {
    const form = document.getElementById('bp-form');
    if (form) form.style.display = 'block';
  }

  if (document.getElementById('eq-tab-rey') && (location.hash === '#rey' || location.hash === '#programados')) {
    switchEquiposTab(location.hash.slice(1));
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
