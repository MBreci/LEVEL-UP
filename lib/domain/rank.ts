export interface Rank {
  name: string;
  slug: string;
  emoji: string;
  min: number;
  tagline: string;
}

export const RANKS: Rank[] = [
  { name: "CANTERANO", slug: "canterano", emoji: "🥉", min: 0, tagline: "El comienzo de tu historia" },
  { name: "DEBUTANTE", slug: "debutante", emoji: "🥈", min: 1000, tagline: "Das tus primeros pasos" },
  { name: "REVELACIÓN", slug: "revelacion", emoji: "❄️", min: 3000, tagline: "Empiezas a llamar la atención" },
  { name: "ELITE", slug: "elite", emoji: "⭐", min: 7000, tagline: "Compites contra los mejores" },
  { name: "CONSAGRADO", slug: "consagrado", emoji: "🔥", min: 15000, tagline: "Tu nombre ya pesa en la cancha" },
  { name: "ÍDOLO", slug: "idolo", emoji: "👑", min: 30000, tagline: "Eres referente e inspiración" },
  { name: "LEYENDA", slug: "leyenda", emoji: "🏛", min: 60000, tagline: "Tu historia ya es parte de LEVEL UP" },
  { name: "GOAT", slug: "goat", emoji: "🐐", min: 120000, tagline: "Eres el mejor de todos los tiempos" },
];

export function getRank(xp: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) if (xp >= r.min) current = r;
  return current;
}

export function getNextRank(xp: number): Rank | null {
  return RANKS.find((r) => r.min > xp) ?? null;
}

export function rankSlug(rank: Rank | null | undefined): string {
  return rank && rank.slug ? rank.slug : "canterano";
}

export interface FunctionalModule {
  id: string;
  label: string;
}

export const FUNCTIONAL_MODULES: FunctionalModule[] = [
  { id: "ficha", label: "MI FICHA" },
  { id: "partidos", label: "PARTIDOS" },
  { id: "reydelbarrio", label: "REY DEL BARRIO" },
  { id: "torneos", label: "TORNEOS" },
  { id: "premios", label: "PREMIOS" },
  { id: "ranking", label: "RANKING" },
];

export interface WipModule {
  name: string;
  icon: string;
}

export const WIP_MODULES: WipModule[] = [
  { name: "EQUIPO DE LA SEMANA", icon: "⭐" },
  { name: "RANKING POR POSICIÓN", icon: "📊" },
  { name: "RANKING ENTRE AMIGOS", icon: "🤝" },
  { name: "PERFIL PÚBLICO", icon: "🌐" },
  { name: "VALOR DE MERCADO", icon: "💹" },
  { name: "LEVEL COINS", icon: "🪙" },
  { name: "FICHAJES", icon: "🔄" },
  { name: "TEMPORADAS", icon: "📅" },
  { name: "HALL OF FAME", icon: "🗿" },
  { name: "MARKETPLACE", icon: "🛒" },
  { name: "PATROCINIOS", icon: "🤝" },
  { name: "FANTASY LEAGUE", icon: "🎮" },
  { name: "TORNEOS PRIVADOS", icon: "🏆" },
  { name: "COMERCIO ENTRE EQUIPOS", icon: "🔁" },
  { name: "IA SCOUTING", icon: "🤖" },
];

/** Rutas de Next.js — reemplaza el PAGE_HREFS de app.js (que apuntaba a *.html). */
export const PAGE_ROUTES: Record<string, string> = {
  ficha: "/carta",
  jugadores: "/jugadores",
  ranking: "/ranking",
  partidos: "/buscar-partido",
  equipos: "/equipos",
  reydelbarrio: "/equipos?tab=rey",
  torneos: "/torneos",
  premios: "/premios",
  temporada: "/temporada-piloto",
};

const BANNED_WORDS = [
  "puta", "puto", "mierda", "pendejo", "pendeja", "cabron", "cabrón", "gonorrea",
  "malparido", "malparida", "hijueputa", "hpta", "verga", "culo", "marica", "maricon", "maricón",
  "perra", "zorra", "idiota", "imbecil", "imbécil", "estupido", "estúpido", "estupida", "estúpida",
  "mamavergas", "chupavergas", "nazi", "hitler",
  "fuck", "shit", "bitch", "asshole", "cunt", "nigger", "nigga", "retard", "retarded",
];

function normalizeForFilter(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function containsProfanity(text: string | null | undefined): boolean {
  if (!text) return false;
  const norm = normalizeForFilter(text);
  return BANNED_WORDS.some((w) => norm.includes(normalizeForFilter(w)));
}

/** Reemplaza cada mala palabra detectada por asteriscos (para el chat). */
export function censorProfanity(text: string | null | undefined): string {
  if (!text) return text || "";
  return String(text).replace(/[\p{L}]+/gu, (word) => {
    const n = normalizeForFilter(word);
    const hit = BANNED_WORDS.some((w) => {
      const nw = normalizeForFilter(w);
      return n === nw || (nw.length >= 5 && n.includes(nw));
    });
    return hit ? "*".repeat(Math.max(3, word.length)) : word;
  });
}
