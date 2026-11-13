export type Position = "DEL" | "MED" | "DEF" | "POR";
export type Gender = "MASCULINO" | "FEMENINO" | "OTRO" | null;

export interface PlayerAttrs {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  fis: number;
}

export interface PlayerPerformanceMetrics {
  vel_max_kmh?: number | null;
  distancia_km?: number | null;
  vel_media_kmh?: number | null;
  sprints?: number | null;
  carreras_intensidad?: number | null;
  fuente?: string | null;
  recomendacion?: string | null;
}

export interface PlayerPhysical {
  weight: number | null;
  height: number | null;
  age: number | null;
  foot: string | null;
  perfil?: PlayerPerformanceMetrics | null;
}

export interface ProfileNotification {
  icon: string;
  text: string;
  time: string;
}

export interface MatchDelta {
  matchId?: string;
  date?: string;
  cancha?: string;
  result?: string;
  mvp?: boolean;
  ovrDelta: number;
  xpGain: number;
  lpGain: number;
  attrsGain?: Partial<PlayerAttrs>;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  name: string;
  nickname: string;
  email: string | null;
  gender: Gender;
  position: Position;
  team: string;
  photo: string | null;
  photoFull?: string | null;
  passwordHash: string;
  securityQuestion: string | null;
  securityAnswerHash: string | null;
  ovr: number;
  xp: number;
  lp: number;
  lastUpdate: MatchDelta | null;
  matches: number;
  goals: number;
  assists: number;
  mvps: number;
  attrs: PlayerAttrs;
  physical: PlayerPhysical;
  history: MatchDelta[];
  notifications: ProfileNotification[];
  notifSeenCount: number;
  achievements: string[];
  saldo: number;
  lockedCoins?: number;
  lockedBets?: Record<string, number>;
  pendingReveal: unknown | null;
  dorsal: number | null;
  isAdmin: boolean;
  founder?: boolean;
  communityRatings?: Record<string, { sum: number; count: number }>;
  ratedPlayers?: Record<string, number>;
}

export type ProfilesById = Record<string, Profile>;

export interface NewProfileInput {
  name: string;
  position: Position;
  team?: string;
  nickname?: string;
  email?: string;
  gender?: Gender;
  passwordHash: string;
  securityQuestion?: string;
  securityAnswerHash?: string;
  isAdmin?: boolean;
}
