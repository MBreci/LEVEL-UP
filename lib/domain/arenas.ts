import type { OpenMatch } from "@/types/match";

export interface Arena {
  id: string;
  name: string;
  badge: string;
  address: string;
  city: string;
  description: string;
  features: string[];
  photos: string[];
  horarios: string[];
  maxSimultaneos: number;
  activa: boolean;
  rating: number;
  matchesPlayed: number;
}

/** Para agregar una nueva sede en el futuro: solo se agrega un nuevo objeto a este arreglo. */
export const ARENAS: Arena[] = [
  {
    id: "arena_170",
    name: "ARENA 170",
    badge: "PRIMERA SEDE OFICIAL DE LEVEL UP",
    address: "Cra. 56 #169A - 94, Bogotá D.C.",
    city: "Bogotá D.C.",
    description:
      "La primera sede oficial de Level Up. Un complejo deportivo diseñado para vivir el fútbol amateur con la mejor experiencia posible.",
    features: [
      "Canchas de césped sintético", "Excelente iluminación nocturna", "Parqueadero disponible",
      "Zona para espectadores", "Mesas y espacio para descansar", "Venta de bebidas y alimentos",
      "Ambiente seguro", "Instalaciones modernas",
    ],
    photos: ["/assets/bg-hero-stadium.jpg", "/assets/bg-competitivo-aerea.jpg", "/assets/bg-comunidad-tribuna.jpg"],
    horarios: ["18:30", "19:30", "20:30", "21:30"],
    maxSimultaneos: 2,
    activa: true,
    rating: 4.8,
    matchesPlayed: 0,
  },
];

export const CATEGORIAS_CANCHA = [
  { id: "5", label: "FÚTBOL 5", icon: "⚽" },
  { id: "6", label: "FÚTBOL 6", icon: "⚽" },
  { id: "7", label: "FÚTBOL 7", icon: "⚽" },
  { id: "8", label: "FÚTBOL 8", icon: "⚽" },
  { id: "11", label: "FÚTBOL 11", icon: "⚽" },
];

export const SUPERFICIES = [
  { id: "SINTÉTICA", label: "SINTÉTICA", disponible: true },
  { id: "NATURAL", label: "CÉSPED", disponible: true },
  { id: "CEMENTO", label: "CEMENTO", disponible: true },
  { id: "LISA", label: "LISA", disponible: true },
];

export function formatHoraLabel(hora24: string): string {
  const [h, m] = hora24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function getArenaSlotCounts(openMatches: OpenMatch[], arenaId: string, fechaISO: string): Record<string, number> {
  const counts: Record<string, number> = {};
  openMatches.forEach((m) => {
    if (m.arenaId === arenaId && m.fechaISO === fechaISO) counts[m.horaValue] = (counts[m.horaValue] || 0) + 1;
  });
  return counts;
}

export interface ArenaSlot {
  hora: string;
  label: string;
  ocupados: number;
  disponible: boolean;
}

export function getArenaAvailableSlots(openMatches: OpenMatch[], arenaId: string, fechaISO: string): ArenaSlot[] {
  const arena = ARENAS.find((a) => a.id === arenaId);
  if (!arena) return [];
  const counts = getArenaSlotCounts(openMatches, arenaId, fechaISO);
  return arena.horarios.map((h) => ({
    hora: h,
    label: formatHoraLabel(h),
    ocupados: counts[h] || 0,
    disponible: (counts[h] || 0) < arena.maxSimultaneos,
  }));
}
