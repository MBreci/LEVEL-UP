export interface JoinLogEntry {
  name: string;
  time: number;
}

export interface Team {
  id: string;
  name: string;
  desc: string;
  city: string;
  color: string;
  photo?: string | null;
  captainId: string;
  memberIds: (string | null)[];
  openForPlayers: boolean;
  joinRequests: string[];
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  streak: string;
  createdAt: number;
  slotPositions: string[];
  leaveRequests: string[];
  joinLog: JoinLogEntry[];
}

export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  fromCaptainId: string;
  toId: string;
  status: "pendiente" | "aceptada" | "rechazada";
  slotIndex?: number | null;
}

export interface TeamChallenge {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  cancha: string;
  costo: string;
  fecha: string;
  hora: string;
  jugadores: string;
  observaciones: string;
  betAmount?: number;
  status: "pendiente" | "aceptado" | "rechazado" | "contraofertado";
  createdAt: number;
  isCounteroffer?: boolean;
  originalChallengeId?: string;
}

export interface TeamMatchStatsEntry {
  goles?: number;
  asistencias?: number;
  pases?: number;
  recuperaciones?: number;
  calificacion?: number;
  mvp?: boolean;
  [key: string]: unknown;
}

export interface TeamMatch {
  id: string;
  teamAId: string;
  teamBId: string;
  cancha: string;
  costo: string;
  fecha: string;
  hora: string;
  jugadores: string;
  observaciones: string;
  betAmount?: number;
  challengeId?: string;
  estado: "programado" | "finalizado" | "cancelado";
  resultado: { golesA: number; golesB: number } | null;
  mvpId: string | null;
  createdAt: number;
  stats: Record<string, TeamMatchStatsEntry>;
  torneoId?: string | null;
  notes: string;
  fechaISO?: string;
}
