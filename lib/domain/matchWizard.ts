import { ARENAS, formatHoraLabel, getArenaAvailableSlots } from "@/lib/domain/arenas";
import { containsProfanity } from "@/lib/domain/rank";
import type { CasualBet, OpenMatch } from "@/types/match";

export const BPW_STEPS = ["MODALIDAD", "CATEGORÍA", "SUPERFICIE", "ARENA", "FECHA Y HORA", "DETALLES"];

export interface Modalidad {
  id: "abierto" | "privado";
  label: string;
  icon: string;
  desc: string;
}

export const MODALIDADES: Modalidad[] = [
  { id: "abierto", label: "PARTIDO ABIERTO", icon: "⚽", desc: "Cualquiera puede unirse según los cupos." },
  { id: "privado", label: "PARTIDO PRIVADO", icon: "🔒", desc: "Apruebas cada solicitud de ingreso." },
];

export interface WizardInvitado {
  profileId: string;
  name: string;
  pos: string;
}

export interface BpWizardState {
  modalidad: "abierto" | "privado" | null;
  categoria: string | null;
  superficie: string;
  arenaId: string | null;
  canchaLibre: boolean;
  canchaLibreNombre: string;
  canchaLibreDireccion: string;
  canchaLibreBarrio: string;
  canchaLibreValor: string;
  canchaLibreObs: string;
  horaLibre: string;
  fechaISO: string | null;
  horaValue: string | null;
  invitados: WizardInvitado[];
  cuposAbiertos: number | null;
  casualBet: CasualBet;
  genero: "MASCULINO" | "FEMENINO" | "MIXTO";
  posiciones: string[];
  ovrMin: string;
  precio: string;
  abierto: boolean;
}

export function makeEmptyWizard(): BpWizardState {
  return {
    modalidad: null, categoria: null, superficie: "SINTÉTICA", arenaId: null, canchaLibre: true,
    canchaLibreNombre: "", canchaLibreDireccion: "", canchaLibreBarrio: "", canchaLibreValor: "", canchaLibreObs: "",
    horaLibre: "", fechaISO: null, horaValue: null, invitados: [], cuposAbiertos: null, casualBet: null,
    genero: "MASCULINO", posiciones: [], ovrMin: "", precio: "", abierto: true,
  };
}

/** Fútbol N = N por equipo × 2 equipos. */
export function getTotalJugadores(w: BpWizardState): number {
  return w.categoria ? parseInt(w.categoria, 10) * 2 : 22;
}

/** El organizador ya ocupa 1 cupo. */
export function getMaxFaltan(w: BpWizardState): number {
  return getTotalJugadores(w) - 1;
}

export function formatFechaPartido(dateStr: string, horaLabel: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dateLabel = d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" });
  return `${dateLabel.charAt(0).toUpperCase()}${dateLabel.slice(1)}, ${horaLabel}`;
}

/** Valida el paso actual antes de avanzar; devuelve el mensaje de error o null si está OK. */
export function validateWizardStep(step: number, w: BpWizardState): string | null {
  if (step === 1 && !w.modalidad) return "Selecciona la modalidad del partido.";
  if (step === 2 && !w.categoria) return "Selecciona el tipo de cancha.";
  if (step === 3 && !w.superficie) return "Selecciona una superficie.";
  if (step === 4) {
    if (!w.canchaLibreNombre.trim()) return "Escribe el nombre de la cancha.";
    if (!w.canchaLibreDireccion.trim()) return "Escribe la dirección de la cancha.";
    if (!w.canchaLibreBarrio.trim()) return "Escribe el barrio o zona de la cancha.";
    if (
      containsProfanity(w.canchaLibreNombre) ||
      containsProfanity(w.canchaLibreObs) ||
      containsProfanity(w.canchaLibreDireccion) ||
      containsProfanity(w.canchaLibreBarrio)
    ) {
      return "El contenido contiene lenguaje inapropiado. Por favor revísalo.";
    }
  }
  if (step === 5) {
    if (!w.fechaISO) return "Selecciona la fecha del partido.";
    const now = new Date();
    const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (w.fechaISO < todayLocal) return "No puedes crear un partido en una fecha que ya pasó.";
    const horaSel = w.canchaLibre ? w.horaLibre : w.horaValue;
    if (!horaSel) return "Indica la hora de inicio del partido.";
    if (w.canchaLibre && w.fechaISO === todayLocal) {
      const [h, m] = w.horaLibre.split(":").map(Number);
      const matchTime = new Date();
      matchTime.setHours(h, m, 0, 0);
      if (matchTime <= now) return "La hora ya pasó. Selecciona una hora futura.";
    }
  }
  return null;
}

export interface CreatorInfo {
  id: string;
  name: string;
}

/** Construye el OpenMatch final a partir del wizard — equivalente a submitMatchRequest. */
export function buildMatchFromWizard(w: BpWizardState, creator: CreatorInfo, openMatches: OpenMatch[]): { match: OpenMatch; error: string | null } {
  const arena = w.canchaLibre ? null : ARENAS.find((a) => a.id === w.arenaId);
  const emptyMatch = null as unknown as OpenMatch;

  if (!w.categoria || !w.fechaISO) return { match: emptyMatch, error: "Completa todos los pasos antes de publicar." };
  if (!w.canchaLibre && (!arena || !w.horaValue)) return { match: emptyMatch, error: "Completa todos los pasos antes de publicar." };
  if (w.canchaLibre && (!w.canchaLibreNombre.trim() || !w.canchaLibreDireccion.trim() || !w.canchaLibreBarrio.trim() || !w.horaLibre)) {
    return { match: emptyMatch, error: "Completa el nombre, la dirección, el barrio y la hora de la cancha." };
  }
  if (!w.canchaLibre && arena) {
    const slots = getArenaAvailableSlots(openMatches, arena.id, w.fechaISO!);
    const chosenSlot = slots.find((s) => s.hora === w.horaValue);
    if (!chosenSlot || !chosenSlot.disponible) {
      return { match: emptyMatch, error: "Ese horario ya no está disponible. Selecciona otro." };
    }
  }
  const cuposAb = w.cuposAbiertos || 0;
  if (cuposAb < 1) return { match: emptyMatch, error: "Debes abrir al menos 1 cupo al público." };

  const necesita = [{ pos: "ABIERTO", cupos: cuposAb, unidos: [] }];
  const confirmadosPrev = w.invitados.map((inv) => ({ profileId: inv.profileId, name: inv.name, pos: inv.pos }));
  const horaLabel = w.canchaLibre ? w.horaLibre : formatHoraLabel(w.horaValue!);
  const fecha = formatFechaPartido(w.fechaISO!, horaLabel);

  const match: OpenMatch = {
    id: "m_" + Date.now(),
    creatorId: creator.id,
    creatorName: creator.name,
    zona: w.canchaLibre ? w.canchaLibreBarrio || "Bogotá" : arena!.city,
    cancha: w.canchaLibre ? w.canchaLibreNombre : arena!.name,
    direccion: w.canchaLibre ? w.canchaLibreDireccion : arena!.address,
    arenaId: w.canchaLibre ? null : arena!.id,
    formato: w.categoria,
    superficie: w.superficie,
    valorPorPersona: w.canchaLibreValor ? parseInt(w.canchaLibreValor, 10) : null,
    observaciones: w.canchaLibreObs || null,
    fecha,
    fechaISO: w.fechaISO!,
    horaValue: w.canchaLibre ? w.horaLibre : w.horaValue!,
    precio: w.precio ? (w.precio as unknown as number) : null,
    ovrMin: w.ovrMin ? parseInt(w.ovrMin, 10) : null,
    abierto: w.abierto,
    necesita,
    confirmadosPrev,
    joinRequests: [],
    finalizado: false,
    prioritario: false,
    casualBet: w.casualBet || null,
    genero: w.genero || "MASCULINO",
    posiciones: w.posiciones || [],
    createdAt: Date.now(),
    stats: {},
    notes: "",
  };
  return { match, error: null };
}
