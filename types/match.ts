export interface MatchSlotMember {
  profileId: string;
  name: string;
}

export interface MatchSlotRequest {
  pos: string;
  cupos: number;
  unidos: MatchSlotMember[];
}

export interface JoinRequest {
  profileId: string;
  name: string;
  pos: string;
}

export type MatchEstado =
  | "buscando_jugadores"
  | "ultimos_cupos"
  | "confirmado"
  | "en_juego"
  | "finalizado";

export type CasualBet = "cancha" | "bebida" | "ambas" | null;

export interface OpenMatch {
  id: string;
  creatorId: string;
  creatorName: string;
  zona: string;
  cancha: string | null;
  direccion: string | null;
  arenaId: string | null;
  formato: string;
  superficie: string | null;
  fecha: string;
  fechaISO: string;
  horaValue: string;
  precio: number | null;
  ovrMin: number | null;
  valorPorPersona: number | null;
  observaciones: string | null;
  confirmadosPrev: { profileId: string; name: string; pos: string }[];
  abierto: boolean;
  necesita: MatchSlotRequest[];
  joinRequests: JoinRequest[];
  finalizado: boolean;
  prioritario: boolean;
  casualBet: CasualBet;
  genero: "MIXTO" | "MASCULINO" | "FEMENINO";
  posiciones: string[];
  createdAt: number;
  stats: Record<string, unknown>;
  notes: string;
  /**
   * Cliente-only — `open_matches` NO tiene columnas `resultado`/`mvp_id` en
   * producción (confirmado por consulta directa: 42703 column does not
   * exist). Estos campos solo viven en memoria/localStorage para que el
   * admin de Modo Libre pueda mostrar el marcador y el MVP durante la sesión
   * actual; un resync completo trae la fila real de la nube (sin estos
   * campos) y los pisa/borra. Esto replica fielmente un gap real de
   * producción — no es un bug a corregir.
   */
  resultado?: { golesLocal: number; golesVisitante: number } | null;
  mvpId?: string | null;
}

export interface DeviceMatchInvite {
  id: string;
  matchId: string;
  zona: string;
  fecha: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  status: "pendiente" | "aceptada" | "rechazada";
}
