import type { Profile, ProfilesById } from "@/types/profile";
import type { Team } from "@/types/team";

export function playerTeamLabel(p: Profile | null, teams: Record<string, Team> = {}): string {
  if (!p) return "SIN EQUIPO";
  const realTeam = Object.values(teams).find((t) => t.memberIds && t.memberIds.includes(p.id));
  return realTeam ? realTeam.name : "SIN EQUIPO";
}

export function isTeamCaptain(p: Profile | null, teams: Record<string, Team> = {}): boolean {
  if (!p) return false;
  return Object.values(teams).some((t) => t.captainId === p.id);
}

export const POSITIONS = ["POR", "DEF", "MED", "DEL"];

export const CANCHAS_REGISTRADAS = ["Arena 170", "Futboleros 170"];

export function getTeamOVR(team: Team, profiles: ProfilesById): number {
  const members = team.memberIds.map((id) => (id ? profiles[id] : undefined)).filter((p): p is Profile => !!p);
  if (!members.length) return 0;
  return Math.round(members.reduce((s, p) => s + (p.ovr || 60), 0) / members.length);
}

export function getTeamRecord(team: Team): { record: string; wins: number; draws: number; losses: number; dg: number } {
  const wins = team.wins || 0,
    draws = team.draws || 0,
    losses = team.losses || 0;
  return { record: `${wins}-${draws}-${losses}`, wins, draws, losses, dg: (team.goalsFor || 0) - (team.goalsAgainst || 0) };
}

export function getMyTeam(teams: Record<string, Team>, myId: string | undefined | null): Team | null {
  if (!myId) return null;
  return Object.values(teams).find((t) => t.memberIds.includes(myId)) || null;
}

export interface NewTeamInput {
  name: string;
  desc?: string;
  city?: string;
  color?: string;
  photo?: string | null;
  captainId: string;
  captainPosition?: string;
}

export function makeTeam(input: NewTeamInput): Team {
  return {
    id: "team_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
    name: input.name.toUpperCase(),
    desc: input.desc || "",
    city: input.city || "",
    color: input.color || "#00f58c",
    photo: input.photo || null,
    captainId: input.captainId,
    memberIds: [input.captainId],
    openForPlayers: false,
    joinRequests: [],
    slotPositions: [input.captainPosition || "", "", "", "", "", ""],
    wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, streak: "",
    createdAt: Date.now(), leaveRequests: [], joinLog: [],
  };
}

export function searchTeams(teams: Record<string, Team>, profiles: ProfilesById, query: string): Team[] {
  const q = (query || "").trim().toLowerCase();
  return Object.values(teams)
    .filter((t) => !q || t.name.toLowerCase().includes(q) || (t.city || "").toLowerCase().includes(q))
    .sort((a, b) => getTeamOVR(b, profiles) - getTeamOVR(a, profiles) || a.name.localeCompare(b.name));
}

export function teamHasMatchAt(teamMatches: import("@/types/team").TeamMatch[], teamId: string, fecha: string, hora: string, excludeMatchId?: string): boolean {
  return teamMatches.some(
    (m) => m.id !== excludeMatchId && m.estado === "programado" && m.fecha === fecha && m.hora === hora && (m.teamAId === teamId || m.teamBId === teamId)
  );
}

export function isTeamMatchPast(m: import("@/types/team").TeamMatch): boolean {
  if (m.estado === "finalizado") return true;
  const raw = m.fechaISO || m.fecha || "";
  const isoMatch = raw.match(/(\d{4}-\d{2}-\d{2})/);
  const dateStr = isoMatch ? isoMatch[1] : null;
  if (dateStr && m.hora) {
    const hora = m.hora.includes(":") ? m.hora.padStart(5, "0") : m.hora;
    return new Date(`${dateStr}T${hora}:00`) < new Date(Date.now() - 2 * 60 * 60 * 1000);
  }
  if (dateStr) {
    return new Date(dateStr + "T23:59:00") < new Date();
  }
  return !!(m.createdAt && Date.now() - m.createdAt > 3 * 24 * 60 * 60 * 1000);
}

export function getTeamMatchesFor(teamMatches: import("@/types/team").TeamMatch[], teamId: string, estado: "programado" | "finalizado"): import("@/types/team").TeamMatch[] {
  return teamMatches
    .filter((m) => {
      if (m.teamAId !== teamId && m.teamBId !== teamId) return false;
      const past = isTeamMatchPast(m);
      return estado === "finalizado" ? past : !past;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}
