/**
 * LEVEL UP — Motor de progresión de jugadores.
 *
 * Reemplaza toda la lógica anterior basada en azar (Math.random) por un
 * sistema determinista: las mismas estadísticas de entrada siempre producen
 * el mismo resultado, y todo cambio es trazable a un evento real del partido.
 *
 * Filosofía: carrera deportiva de largo plazo, no arcade.
 * - OVR: se mueve poco por partido (estilo Elo/Glicko, factor K bajo).
 * - XP: siempre sube, premia participación y eventos, nunca castiga.
 * - LP: sube/baja según resultado AJUSTADO por el rating del rival (Elo de equipos).
 * - Confianza: multiplicador lento que acelera/frena cuánto puede moverse el OVR.
 * - Forma: promedio móvil de los últimos N partidos, temporal, no permanente.
 */

const CONFIG = {
  // --- OVR ---
  OVR_K_FACTOR: 0.45,        // qué tan rápido reacciona el OVR a la diferencia entre PS y OVR esperado
  OVR_MIN: 40,
  OVR_MAX: 99,
  OVR_MOVING_AVG_WINDOW: 10, // partidos usados para calcular el "OVR esperado"

  // --- Forma (rolling window corto, temporal) ---
  FORM_WINDOW: 5,

  // --- Confianza ---
  CONFIDENCE_MIN: 0.7,
  CONFIDENCE_MAX: 1.3,
  CONFIDENCE_STEP: 0.04,     // cuánto se mueve la confianza por partido por encima/debajo del promedio propio

  // --- XP ---
  XP_BASE_PARTICIPACION: 40,
  XP_POR_GOL: 60,
  XP_POR_ASISTENCIA: 40,
  XP_POR_VICTORIA: 80,
  XP_POR_EMPATE: 30,
  XP_MVP_BONUS: 150,

  // --- LP (estilo ranked, ajustado por rival) ---
  LP_K_FACTOR: 24,           // factor K clásico de Elo para la conversión resultado-esperado -> LP
  LP_BASE_VICTORIA: 18,
  LP_BASE_DERROTA: -14,
  LP_BASE_EMPATE: 2,

  // --- Elo de equipos (rating de club, independiente del rating de jugador) ---
  TEAM_ELO_K_FACTOR: 20,
  TEAM_ELO_DEFAULT: 1200,
};

/** Pesos posicionales: qué tanto vale cada evento según la posición del jugador. */
const POSITION_WEIGHTS = {
  DEL: { gol: 10, asistencia: 6, tiro: 1.5, recuperacion: 0.5, error: -6, fallo: -2, amarilla: -4, roja: -15 },
  MED: { gol: 8,  asistencia: 8, tiro: 1.2, recuperacion: 1.5, error: -6, fallo: -2, amarilla: -4, roja: -15 },
  DEF: { gol: 7,  asistencia: 5, tiro: 1,   recuperacion: 2.5, error: -8, fallo: -1.5, amarilla: -4, roja: -15 },
  POR: { gol: 7,  asistencia: 3, tiro: 0,   recuperacion: 0, atajada: 4, golRecibido: -3, error: -10, fallo: -1, amarilla: -4, roja: -15 },
};

/**
 * Performance Score (PS): nota objetiva 0-100 de un jugador en un partido,
 * a partir de eventos crudos (conteos), ponderados por su posición.
 * @param {Record<string, number>} events conteo de cada tipo de evento (gol, asistencia, tiro, recuperacion, atajada, golRecibido, error, fallo, amarilla, roja)
 * @param {'DEL'|'MED'|'DEF'|'POR'} position
 */
function computePerformanceScore(events, position) {
  const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.MED;
  let score = 50;
  for (const [key, count] of Object.entries(events)) {
    const w = weights[key];
    if (w) score += w * count;
  }
  return Math.max(0, Math.min(100, score));
}

/**
 * Promedio móvil simple sobre los últimos `window` valores de una serie histórica.
 * Si hay menos partidos que `window`, promedia los que existan (no penaliza novatos).
 */
function movingAverage(history, window) {
  if (!history.length) return null;
  const slice = history.slice(-window);
  return slice.reduce((s, v) => s + v, 0) / slice.length;
}

/** Forma: promedio móvil corto (temporal) de los Performance Score recientes. */
function computeForm(psHistory) {
  return movingAverage(psHistory, CONFIG.FORM_WINDOW);
}

/**
 * Confianza: sube si el PS del partido actual superó el promedio propio reciente,
 * baja si quedó por debajo. Es lo que acelera o frena el efecto del OVR.
 */
function updateConfidence(currentConfidence, ps, ownRecentAverage) {
  if (ownRecentAverage == null) return currentConfidence;
  const direction = ps >= ownRecentAverage ? 1 : -1;
  const next = currentConfidence + direction * CONFIG.CONFIDENCE_STEP;
  return Math.max(CONFIG.CONFIDENCE_MIN, Math.min(CONFIG.CONFIDENCE_MAX, next));
}

/**
 * OVR — núcleo del sistema "carrera de largo plazo".
 *
 * No compara el PS del partido contra el OVR actual directamente (eso sería
 * arcade y volátil). Lo compara contra el "OVR esperado": el promedio móvil
 * de los PS recientes del jugador. Así, solo se premia/castiga la diferencia
 * MARGINAL respecto a su propio nivel reciente, escalada por un factor K bajo
 * y por la confianza acumulada — igual que Elo/Glicko en ajedrez o ranked de LoL.
 */
function computeOvrUpdate({ currentOvr, ps, psHistory, confidence }) {
  const expected = movingAverage(psHistory, CONFIG.OVR_MOVING_AVG_WINDOW);
  if (expected == null) {
    // primer partido del jugador: no hay base de comparación, no se mueve el OVR todavía
    return { newOvr: currentOvr, delta: 0, expected: ps };
  }
  const psNormalizedDelta = (ps - expected) / 10; // escala el PS (0-100) a un rango comparable con puntos de OVR
  const rawDelta = CONFIG.OVR_K_FACTOR * confidence * psNormalizedDelta;
  const delta = Math.max(-2, Math.min(2, Math.round(rawDelta * 10) / 10)); // tope duro por partido: nunca más de ±2
  const newOvr = Math.max(CONFIG.OVR_MIN, Math.min(CONFIG.OVR_MAX, currentOvr + delta));
  return { newOvr, delta: Math.round((newOvr - currentOvr) * 10) / 10, expected };
}

/** XP: siempre positivo, premia participación, eventos y MVP. Nunca resta por derrota. */
function computeXpGain({ goles, asistencias, resultado, isMvp }) {
  let xp = CONFIG.XP_BASE_PARTICIPACION + goles * CONFIG.XP_POR_GOL + asistencias * CONFIG.XP_POR_ASISTENCIA;
  if (resultado === 'VICTORIA') xp += CONFIG.XP_POR_VICTORIA;
  if (resultado === 'EMPATE') xp += CONFIG.XP_POR_EMPATE;
  if (isMvp) xp += CONFIG.XP_MVP_BONUS;
  return Math.round(xp);
}

/** Probabilidad esperada de victoria en un duelo Elo entre dos ratings. */
function eloExpectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * LP — sube/baja según el resultado ajustado por el rating Elo del equipo rival.
 * Ganarle a un rival más fuerte da más LP que ganarle a uno más débil; perder
 * contra uno más débil resta más que perder contra uno más fuerte.
 */
function computeLpChange({ resultado, teamRatingSelf, teamRatingRival }) {
  const expected = eloExpectedScore(teamRatingSelf, teamRatingRival);
  const actual = resultado === 'VICTORIA' ? 1 : resultado === 'EMPATE' ? 0.5 : 0;
  const eloAdjustment = CONFIG.LP_K_FACTOR * (actual - expected);
  const base = resultado === 'VICTORIA' ? CONFIG.LP_BASE_VICTORIA : resultado === 'EMPATE' ? CONFIG.LP_BASE_EMPATE : CONFIG.LP_BASE_DERROTA;
  return Math.round(base + eloAdjustment);
}

/** Rating Elo de equipo/club: se actualiza tras cada partido igual que un Elo de ajedrez. */
function computeTeamEloUpdate({ ratingSelf, ratingRival, resultado }) {
  const expected = eloExpectedScore(ratingSelf, ratingRival);
  const actual = resultado === 'VICTORIA' ? 1 : resultado === 'EMPATE' ? 0.5 : 0;
  const delta = Math.round(CONFIG.TEAM_ELO_K_FACTOR * (actual - expected));
  return { newRating: ratingSelf + delta, delta };
}

/**
 * Punto de entrada: dado el estado actual de un jugador y los eventos crudos
 * de un partido, calcula la actualización completa de todos los sistemas.
 * Es una función pura — no muta nada, no llama a la base de datos.
 */
function evaluateMatchForPlayer({
  position,
  events,
  currentOvr,
  psHistory,
  confidence,
  resultado,
  isMvp,
  teamRatingSelf,
  teamRatingRival,
}) {
  const ps = computePerformanceScore(events, position);
  const ownRecentAverage = movingAverage(psHistory, CONFIG.FORM_WINDOW);
  const newConfidence = updateConfidence(confidence, ps, ownRecentAverage);
  const ovrResult = computeOvrUpdate({ currentOvr, ps, psHistory, confidence: newConfidence });
  const xpGain = computeXpGain({ goles: events.gol || 0, asistencias: events.asistencia || 0, resultado, isMvp });
  const lpChange = computeLpChange({ resultado, teamRatingSelf, teamRatingRival });
  const newPsHistory = [...psHistory, ps];
  const form = computeForm(newPsHistory);

  return {
    ps,
    ovr: ovrResult,
    confidence: newConfidence,
    xpGain,
    lpChange,
    form,
    psHistory: newPsHistory,
  };
}

const ProgressionEngine = {
  CONFIG,
  POSITION_WEIGHTS,
  computePerformanceScore,
  movingAverage,
  computeForm,
  updateConfidence,
  computeOvrUpdate,
  computeXpGain,
  eloExpectedScore,
  computeLpChange,
  computeTeamEloUpdate,
  evaluateMatchForPlayer,
};

if (typeof module !== 'undefined' && module.exports) module.exports = ProgressionEngine;
if (typeof window !== 'undefined') window.ProgressionEngine = ProgressionEngine;
