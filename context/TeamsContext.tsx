"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { createLocalStore } from "@/lib/localStore";
import { getSupabase } from "@/lib/supabase/client";
import { useRegisterSync } from "@/context/SyncRegistry";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import {
  fetchAllTeamPhotos,
  fetchChallengesFromCloud,
  fetchTeamFromCloud,
  fetchTeamInvitesFromCloud,
  fetchTeamMatchesFromCloud,
  fetchTeamPhoto,
  fetchTeamsFromCloud,
  pushChallengeToCloud,
  pushTeamInviteToCloud,
  pushTeamMatchToCloud,
  pushTeamPhotoToCloud,
  pushTeamToCloud,
} from "@/lib/domain/teamsCloud";
import { getMyTeam as getMyTeamPure, makeTeam, teamHasMatchAt } from "@/lib/domain/teams";
import { computeMatchDeltas, checkAchievements, type MatchStatsInput } from "@/lib/domain/matchDeltas";
import { pushProfileToCloud } from "@/lib/domain/profiles";
import { correctTeamMatchAdmin, finalizeTeamMatchAdmin, type ApFinalizeInput } from "@/lib/domain/adminTeamMatch";
import {
  statsHubResetTeamMatch as statsHubResetTeamMatchPure,
  statsHubSaveTeamMatch as statsHubSaveTeamMatchPure,
  type StatsHubTeamSaveInput,
} from "@/lib/domain/adminStatsHub";
import type { Team, TeamChallenge, TeamInvite, TeamMatch } from "@/types/team";
import type { Profile } from "@/types/profile";

const teamsStore = createLocalStore<Record<string, Team>>("levelup_teams", {});
const teamInvitesStore = createLocalStore<TeamInvite[]>("levelup_team_invites", []);
const challengesStore = createLocalStore<TeamChallenge[]>("levelup_challenges", []);
const teamMatchesStore = createLocalStore<TeamMatch[]>("levelup_team_matches", []);

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface TeamsContextValue {
  teams: Record<string, Team>;
  teamInvites: TeamInvite[];
  challenges: TeamChallenge[];
  teamMatches: TeamMatch[];
  myTeam: Team | null;
  myTeamInvites: TeamInvite[];
  myChallenges: TeamChallenge[];
  myLeaveRequests: { team: Team; playerId: string }[];
  refresh: () => Promise<void>;
  createTeam: (input: { name: string; desc: string; city: string; color: string; photo: string | null }) => Promise<ActionResult>;
  editTeam: (teamId: string, input: { name: string; desc: string; city: string; color: string; photo?: string | null }) => Promise<ActionResult>;
  toggleOpenForPlayers: (teamId: string) => Promise<void>;
  setSlotPosition: (teamId: string, idx: number, pos: string) => Promise<void>;
  sendTeamInvite: (teamId: string, playerId: string, slotIndex?: number) => Promise<ActionResult>;
  respondTeamInvite: (inviteId: string, accept: boolean) => Promise<void>;
  requestJoinTeam: (teamId: string) => Promise<ActionResult>;
  respondJoinRequest: (teamId: string, playerId: string, accept: boolean) => Promise<void>;
  requestLeaveTeam: () => Promise<ActionResult>;
  respondLeaveRequest: (teamId: string, playerId: string, accept: boolean) => Promise<void>;
  kickTeamMember: (teamId: string, playerId: string) => Promise<void>;
  sendChallenge: (input: Omit<TeamChallenge, "id" | "fromTeamId" | "status" | "createdAt">) => Promise<ActionResult>;
  respondChallenge: (challengeId: string, accept: boolean) => Promise<ActionResult>;
  sendCounteroffer: (challengeId: string, newBet: number) => Promise<ActionResult>;
  finalizeTeamMatch: (
    matchId: string,
    golesA: number,
    golesB: number,
    mvpId: string | null,
    playerStats: Record<string, MatchStatsInput>
  ) => Promise<ActionResult>;
  ensureTeamPhoto: (teamId: string) => Promise<boolean>;
  cancelTeamMatch: (matchId: string) => Promise<ActionResult>;
  createTournamentMatch: (input: { torneoId: string; teamAId: string; teamBId: string; fecha: string; hora: string; cancha: string }) => Promise<ActionResult>;
  adminFinalizeTeamMatch: (matchId: string, input: ApFinalizeInput) => Promise<ActionResult>;
  adminCorrectTeamMatch: (matchId: string, input: ApFinalizeInput) => Promise<ActionResult>;
  statsHubSaveTeamMatch: (matchId: string, input: StatsHubTeamSaveInput, correctionOnly: boolean) => Promise<ActionResult>;
  statsHubResetTeamMatch: (matchId: string) => Promise<ActionResult>;
}

const TeamsContext = createContext<TeamsContextValue | null>(null);

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const { profile: me, saveProfile } = useAuth();
  const { profiles, setProfile } = useProfiles();
  const teams = teamsStore.useValue();
  const teamInvites = teamInvitesStore.useValue();
  const challenges = challengesStore.useValue();
  const teamMatches = teamMatchesStore.useValue();
  const photosLoaded = useRef(false);

  const refresh = useCallback(async () => {
    const sb = getSupabase();
    const [freshTeams, freshInvites, freshChallenges, freshMatches] = await Promise.all([
      fetchTeamsFromCloud(sb),
      fetchTeamInvitesFromCloud(sb),
      fetchChallengesFromCloud(sb),
      fetchTeamMatchesFromCloud(sb),
    ]);
    if (freshTeams) {
      teamsStore.set((prev) => {
        const next: Record<string, Team> = {};
        freshTeams.forEach((t) => {
          const prevPhoto = prev[t.id]?.photo;
          next[t.id] = prevPhoto ? { ...t, photo: prevPhoto } : t;
        });
        return next;
      });
    }
    if (freshInvites) {
      teamInvitesStore.set((prev) => {
        const byId = new Map(prev.map((i) => [i.id, i]));
        freshInvites.forEach((i) => byId.set(i.id, i));
        return Array.from(byId.values());
      });
    }
    if (freshChallenges) {
      challengesStore.set((prev) => {
        const byId = new Map(prev.map((c) => [c.id, c]));
        freshChallenges.forEach((c) => byId.set(c.id, c));
        return Array.from(byId.values());
      });
    }
    if (freshMatches) {
      teamMatchesStore.set((prev) => {
        const byId = new Map(prev.map((m) => [m.id, m]));
        freshMatches.forEach((m) => byId.set(m.id, m));
        return Array.from(byId.values());
      });
    }
    if (!photosLoaded.current) {
      photosLoaded.current = true;
      const photos = await fetchAllTeamPhotos(sb);
      if (photos) {
        teamsStore.set((prev) => {
          const next = { ...prev };
          let changed = false;
          photos.forEach((r) => {
            if (next[r.id] && next[r.id].photo === undefined) {
              next[r.id] = { ...next[r.id], photo: r.photo };
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
  }, []);

  useRegisterSync(refresh, [refresh]);
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myTeam = useMemo(() => getMyTeamPure(teams, me?.id), [teams, me?.id]);

  const myTeamInvites = useMemo(() => (me ? teamInvites.filter((i) => i.toId === me.id && i.status === "pendiente") : []), [teamInvites, me]);

  const myChallenges = useMemo(
    () => (myTeam && me && myTeam.captainId === me.id ? challenges.filter((c) => c.toTeamId === myTeam.id && c.status === "pendiente") : []),
    [challenges, myTeam, me]
  );

  const myLeaveRequests = useMemo(() => {
    if (!myTeam || !me || myTeam.captainId !== me.id || !myTeam.leaveRequests) return [];
    return myTeam.leaveRequests.map((playerId) => ({ team: myTeam, playerId }));
  }, [myTeam, me]);

  const notify = useCallback(
    async (profileId: string, icon: string, text: string) => {
      const p = profiles[profileId];
      if (!p) return;
      const updated: Profile = { ...p, notifications: [...p.notifications, { icon, text, time: "AHORA" }] };
      setProfile(updated);
      await pushProfileToCloud(getSupabase(), updated);
    },
    [profiles, setProfile]
  );

  const createTeam = useCallback(
    async (input: { name: string; desc: string; city: string; color: string; photo: string | null }): Promise<ActionResult> => {
      if (!me) return { ok: false, error: "Inicia sesión para crear un equipo." };
      if (getMyTeamPure(teams, me.id)) return { ok: false, error: "Ya perteneces a un equipo en este dispositivo." };
      if (!input.name.trim()) return { ok: false, error: "Escribe el nombre del equipo." };
      const team = makeTeam({ ...input, captainId: me.id, captainPosition: me.position });
      teamsStore.set((prev) => ({ ...prev, [team.id]: team }));
      const sb = getSupabase();
      await pushTeamToCloud(sb, team);
      if (input.photo) await pushTeamPhotoToCloud(sb, team);
      await saveProfile({ ...me, team: team.name });
      return { ok: true };
    },
    [me, teams, saveProfile]
  );

  const editTeam = useCallback(
    async (teamId: string, input: { name: string; desc: string; city: string; color: string; photo?: string | null }): Promise<ActionResult> => {
      const team = teams[teamId];
      if (!team || !me || team.captainId !== me.id) return { ok: false };
      if (!input.name.trim()) return { ok: false, error: "Escribe el nombre del equipo." };
      const updated: Team = { ...team, name: input.name.toUpperCase(), desc: input.desc, city: input.city, color: input.color };
      if (input.photo !== undefined) updated.photo = input.photo;
      teamsStore.set((prev) => ({ ...prev, [teamId]: updated }));
      const sb = getSupabase();
      await pushTeamToCloud(sb, updated);
      if (input.photo !== undefined) await pushTeamPhotoToCloud(sb, updated);
      if (me.team) await saveProfile({ ...me, team: updated.name });
      return { ok: true };
    },
    [teams, me, saveProfile]
  );

  const toggleOpenForPlayers = useCallback(
    async (teamId: string) => {
      const team = teams[teamId];
      if (!team || !me || team.captainId !== me.id) return;
      const updated = { ...team, openForPlayers: !team.openForPlayers };
      teamsStore.set((prev) => ({ ...prev, [teamId]: updated }));
      await pushTeamToCloud(getSupabase(), updated);
    },
    [teams, me]
  );

  const setSlotPosition = useCallback(
    async (teamId: string, idx: number, pos: string) => {
      const team = teams[teamId];
      if (!team || !me || team.captainId !== me.id) return;
      const slotPositions = [...(team.slotPositions || ["", "", "", "", "", ""])];
      slotPositions[idx] = pos;
      const updated = { ...team, slotPositions };
      teamsStore.set((prev) => ({ ...prev, [teamId]: updated }));
      await pushTeamToCloud(getSupabase(), updated);
    },
    [teams, me]
  );

  const sendTeamInvite = useCallback(
    async (teamId: string, playerId: string, slotIndex?: number): Promise<ActionResult> => {
      const team = teams[teamId];
      const player = profiles[playerId];
      if (!team || !player || !me) return { ok: false };
      if (slotIndex === undefined && team.memberIds.length >= 8) {
        return { ok: false, error: "Tu equipo ya tiene los 8 cupos llenos (6 titulares + 2 suplentes)." };
      }
      const existing = teamInvites.find((i) => i.teamId === teamId && i.toId === playerId && i.status === "pendiente");
      const sb = getSupabase();
      if (existing) {
        await pushTeamInviteToCloud(sb, existing);
        return { ok: true, error: "Ya le habías enviado una invitación a este jugador. La reenviamos por si no había llegado." };
      }
      const invite: TeamInvite = {
        id: "tinv_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        teamId, teamName: team.name, fromCaptainId: me.id, toId: playerId, status: "pendiente",
        slotIndex: slotIndex ?? null,
      };
      teamInvitesStore.set((prev) => [...prev, invite]);
      await pushTeamInviteToCloud(sb, invite);
      const isSub = (slotIndex ?? -1) >= 6;
      const posLabel = slotIndex === undefined ? "jugador" : isSub ? `suplente ${slotIndex! - 5}` : `titular ${slotIndex! + 1}`;
      await notify(playerId, "🛡️", `${team.name} te invitó a unirte como ${posLabel}. Capitán: ${me.nickname || me.name}.`);
      return { ok: true };
    },
    [teams, profiles, me, teamInvites, notify]
  );

  const respondTeamInvite = useCallback(
    async (inviteId: string, accept: boolean) => {
      if (!me) return;
      const invite = teamInvites.find((i) => i.id === inviteId);
      if (!invite) return;
      const updatedInvite: TeamInvite = { ...invite, status: accept ? "aceptada" : "rechazada" };
      teamInvitesStore.set((prev) => prev.map((i) => (i.id === inviteId ? updatedInvite : i)));
      const sb = getSupabase();
      await pushTeamInviteToCloud(sb, updatedInvite);

      let team = teams[invite.teamId];
      if (accept && !team) {
        const remote = await fetchTeamFromCloud(sb, invite.teamId);
        if (remote) {
          team = remote;
          teamsStore.set((prev) => ({ ...prev, [invite.teamId]: remote }));
        }
      }
      if (accept && team && !team.memberIds.includes(me.id)) {
        const memberIds = [...team.memberIds];
        if (invite.slotIndex !== undefined && invite.slotIndex !== null) {
          while (memberIds.length <= invite.slotIndex) memberIds.push(null);
          if (memberIds[invite.slotIndex]) memberIds.push(me.id);
          else memberIds[invite.slotIndex] = me.id;
        } else if (memberIds.length < 8) {
          memberIds.push(me.id);
        }
        const joinLog = [...(team.joinLog || []), { name: me.nickname || me.name, time: Date.now() }];
        const updatedTeam = { ...team, memberIds, joinLog };
        teamsStore.set((prev) => ({ ...prev, [invite.teamId]: updatedTeam }));
        await pushTeamToCloud(sb, updatedTeam);
        await saveProfile({ ...me, team: updatedTeam.name });
      }
      await notify(invite.fromCaptainId, accept ? "✅" : "❌", `${me.nickname || me.name} ${accept ? "aceptó" : "rechazó"} tu invitación a ${invite.teamName}.`);
    },
    [me, teamInvites, teams, saveProfile, notify]
  );

  const requestJoinTeam = useCallback(
    async (teamId: string): Promise<ActionResult> => {
      const team = teams[teamId];
      if (!team || !me) return { ok: false };
      if (team.memberIds.includes(me.id)) return { ok: false };
      if (team.joinRequests.includes(me.id)) return { ok: false };
      const updated = { ...team, joinRequests: [...team.joinRequests, me.id] };
      teamsStore.set((prev) => ({ ...prev, [teamId]: updated }));
      await pushTeamToCloud(getSupabase(), updated);
      await notify(team.captainId, "🙋", `${me.nickname || me.name} solicitó unirse a ${team.name}.`);
      return { ok: true };
    },
    [teams, me, notify]
  );

  const respondJoinRequest = useCallback(
    async (teamId: string, playerId: string, accept: boolean) => {
      const team = teams[teamId];
      if (!team || !me || team.captainId !== me.id) return;
      const joinRequests = team.joinRequests.filter((id) => id !== playerId);
      let memberIds = team.memberIds;
      let joinLog = team.joinLog;
      if (accept && team.memberIds.length < 6 && !team.memberIds.includes(playerId)) {
        memberIds = [...team.memberIds, playerId];
        const player0 = profiles[playerId];
        joinLog = [...(team.joinLog || []), { name: player0 ? player0.nickname || player0.name : "", time: Date.now() }];
      }
      const updated = { ...team, joinRequests, memberIds, joinLog };
      teamsStore.set((prev) => ({ ...prev, [teamId]: updated }));
      await pushTeamToCloud(getSupabase(), updated);
      const player = profiles[playerId];
      if (player) {
        const updatedPlayer: Profile = {
          ...player,
          team: accept ? updated.name : player.team,
          notifications: [...player.notifications, { icon: accept ? "✅" : "❌", text: `Tu solicitud para unirte a ${team.name} fue ${accept ? "aceptada" : "rechazada"}.`, time: "AHORA" }],
        };
        setProfile(updatedPlayer);
        await pushProfileToCloud(getSupabase(), updatedPlayer);
        if (me.id === playerId) await saveProfile(updatedPlayer);
      }
    },
    [teams, me, profiles, setProfile, saveProfile]
  );

  const requestLeaveTeam = useCallback(async (): Promise<ActionResult> => {
    if (!me) return { ok: false };
    const team = myTeam;
    if (!team) return { ok: false };
    if (team.captainId === me.id) {
      return { ok: false, error: `Eres el capitán de ${team.name}. Para salir primero debes transferir la capitanía o disolver el equipo (próximamente).` };
    }
    if ((team.leaveRequests || []).includes(me.id)) return { ok: false, error: "Ya enviaste una solicitud para salir de este equipo." };
    const updated = { ...team, leaveRequests: [...(team.leaveRequests || []), me.id] };
    teamsStore.set((prev) => ({ ...prev, [team.id]: updated }));
    await pushTeamToCloud(getSupabase(), updated);
    await notify(team.captainId, "🚪", `${me.nickname || me.name} solicitó salir de ${team.name}.`);
    return { ok: true };
  }, [me, myTeam, notify]);

  const respondLeaveRequest = useCallback(
    async (teamId: string, playerId: string, accept: boolean) => {
      const team = teams[teamId];
      if (!team || !me || team.captainId !== me.id) return;
      const leaveRequests = (team.leaveRequests || []).filter((id) => id !== playerId);
      const remainingMemberIds = team.memberIds.filter((id) => id !== playerId);
      const updated = { ...team, leaveRequests, memberIds: accept ? remainingMemberIds : team.memberIds };
      teamsStore.set((prev) => ({ ...prev, [teamId]: updated }));
      await pushTeamToCloud(getSupabase(), updated);
      const leavingPlayer = profiles[playerId];
      const player = profiles[playerId];
      if (player) {
        const updatedPlayer: Profile = {
          ...player,
          team: accept ? "SIN EQUIPO" : player.team,
          notifications: [...player.notifications, { icon: accept ? "✅" : "❌", text: `Tu solicitud para salir de ${team.name} fue ${accept ? "aceptada" : "rechazada"}.`, time: "AHORA" }],
        };
        setProfile(updatedPlayer);
        await pushProfileToCloud(getSupabase(), updatedPlayer);
        if (me.id === playerId) await saveProfile(updatedPlayer);
      }
      if (accept && leavingPlayer) {
        for (const id of remainingMemberIds) {
          if (id) await notify(id, "🚪", `${leavingPlayer.nickname || leavingPlayer.name} salió de ${team.name}.`);
        }
      }
    },
    [teams, me, profiles, setProfile, saveProfile, notify]
  );

  const kickTeamMember = useCallback(
    async (teamId: string, playerId: string) => {
      const team = teams[teamId];
      if (!team || !me || me.id !== team.captainId || playerId === team.captainId) return;
      if (!team.memberIds.includes(playerId)) return;
      const remainingMemberIds = team.memberIds.filter((id) => id !== playerId);
      const updated = { ...team, memberIds: remainingMemberIds };
      teamsStore.set((prev) => ({ ...prev, [teamId]: updated }));
      await pushTeamToCloud(getSupabase(), updated);
      const kickedPlayer = profiles[playerId];
      if (kickedPlayer) {
        const updatedKicked: Profile = {
          ...kickedPlayer,
          team: "SIN EQUIPO",
          notifications: [...kickedPlayer.notifications, { icon: "🚪", text: `Fuiste retirado del equipo ${team.name} por el capitán.`, time: "AHORA" }],
        };
        setProfile(updatedKicked);
        await pushProfileToCloud(getSupabase(), updatedKicked);
        for (const id of remainingMemberIds) {
          if (id) await notify(id, "🚪", `${kickedPlayer.nickname || kickedPlayer.name} fue retirado de ${team.name} por el capitán.`);
        }
      }
    },
    [teams, me, profiles, setProfile, notify]
  );

  const sendChallenge = useCallback(
    async (input: Omit<TeamChallenge, "id" | "fromTeamId" | "status" | "createdAt">): Promise<ActionResult> => {
      if (!me) return { ok: false };
      if (!myTeam || myTeam.captainId !== me.id) return { ok: false, error: "Solo el capitán puede retar a otro equipo." };
      if (!input.fecha || !input.hora) return { ok: false, error: "Escoge fecha y hora para el reto." };
      if (teamHasMatchAt(teamMatches, myTeam.id, input.fecha, input.hora)) return { ok: false, error: "Tu equipo ya tiene un partido programado a esa fecha y hora." };
      if (teamHasMatchAt(teamMatches, input.toTeamId, input.fecha, input.hora)) return { ok: false, error: "El equipo rival ya tiene un partido programado a esa fecha y hora." };
      const betAmount = input.betAmount || 0;
      if (betAmount > 0 && (me.saldo || 0) < betAmount) {
        return { ok: false, error: `Saldo insuficiente para apostar ${betAmount.toLocaleString("es-CO")} 🪙. Recarga primero.` };
      }
      const challenge: TeamChallenge = {
        ...input,
        id: "ch_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        fromTeamId: myTeam.id,
        status: "pendiente",
        createdAt: Date.now(),
      };
      if (betAmount > 0) {
        await saveProfile({
          ...me,
          saldo: (me.saldo || 0) - betAmount,
          lockedCoins: (me.lockedCoins || 0) + betAmount,
          lockedBets: { ...(me.lockedBets || {}), [challenge.id]: betAmount },
        });
      }
      challengesStore.set((prev) => [...prev, challenge]);
      await pushChallengeToCloud(getSupabase(), challenge);
      const toTeam = teams[input.toTeamId];
      if (toTeam) {
        const betTxt = betAmount > 0 ? ` — Apuesta: ${betAmount.toLocaleString("es-CO")} 🪙 por equipo` : "";
        await notify(toTeam.captainId, "⚔️", `${myTeam.name} te retó a un partido en ${input.cancha} — ${input.fecha} ${input.hora}${betTxt}.`);
      }
      return { ok: true };
    },
    [me, myTeam, teamMatches, teams, saveProfile, notify]
  );

  const respondChallenge = useCallback(
    async (challengeId: string, accept: boolean): Promise<ActionResult> => {
      if (!me) return { ok: false };
      const challenge = challenges.find((c) => c.id === challengeId);
      if (!challenge) return { ok: false };
      const fromTeam = teams[challenge.fromTeamId];
      const toTeam = teams[challenge.toTeamId];
      if (accept && (teamHasMatchAt(teamMatches, challenge.fromTeamId, challenge.fecha, challenge.hora) || teamHasMatchAt(teamMatches, challenge.toTeamId, challenge.fecha, challenge.hora))) {
        return { ok: false, error: "No puedes aceptar este reto: uno de los dos equipos ya tiene un partido programado a esa fecha y hora." };
      }
      const betAmount = challenge.betAmount || 0;
      if (accept && betAmount > 0) {
        if ((me.saldo || 0) < betAmount) return { ok: false, error: "Saldo insuficiente para esta apuesta." };
        await saveProfile({
          ...me,
          saldo: (me.saldo || 0) - betAmount,
          lockedCoins: (me.lockedCoins || 0) + betAmount,
          lockedBets: { ...(me.lockedBets || {}), [challengeId]: betAmount },
        });
      }
      if (!accept && betAmount > 0 && fromTeam) {
        // Devuelve los coins bloqueados al retador original.
        const fromCaptain = profiles[fromTeam.captainId];
        if (fromCaptain?.lockedBets?.[challengeId]) {
          const lockedBets = { ...fromCaptain.lockedBets };
          delete lockedBets[challengeId];
          const updatedCaptain: Profile = {
            ...fromCaptain,
            saldo: (fromCaptain.saldo || 0) + betAmount,
            lockedCoins: Math.max(0, (fromCaptain.lockedCoins || 0) - betAmount),
            lockedBets,
          };
          setProfile(updatedCaptain);
          await pushProfileToCloud(getSupabase(), updatedCaptain);
        }
      }
      const updatedChallenge: TeamChallenge = { ...challenge, status: accept ? "aceptado" : "rechazado" };
      challengesStore.set((prev) => prev.map((c) => (c.id === challengeId ? updatedChallenge : c)));
      await pushChallengeToCloud(getSupabase(), updatedChallenge);

      if (accept && fromTeam && toTeam) {
        const match: TeamMatch = {
          id: "tm_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          teamAId: fromTeam.id, teamBId: toTeam.id, cancha: challenge.cancha, costo: challenge.costo,
          fecha: challenge.fecha, hora: challenge.hora, jugadores: challenge.jugadores, observaciones: challenge.observaciones,
          betAmount, challengeId, estado: "programado", resultado: null, mvpId: null, createdAt: Date.now(),
          stats: {}, notes: "",
        };
        teamMatchesStore.set((prev) => [...prev, match]);
        await pushTeamMatchToCloud(getSupabase(), match);
      }
      if (fromTeam) {
        const betTxt = betAmount > 0 ? ` — Apuesta de ${betAmount.toLocaleString("es-CO")} 🪙 ${accept ? "confirmada" : "devuelta"}.` : "";
        await notify(fromTeam.captainId, accept ? "✅" : "❌", `${toTeam ? toTeam.name : "El equipo rival"} ${accept ? "aceptó" : "rechazó"} tu reto.${betTxt}`);
      }
      return { ok: true };
    },
    [me, challenges, teams, teamMatches, saveProfile, notify, profiles, setProfile]
  );

  const sendCounteroffer = useCallback(
    async (challengeId: string, newBet: number): Promise<ActionResult> => {
      if (!me || !myTeam) return { ok: false };
      const c = challenges.find((x) => x.id === challengeId);
      if (!c) return { ok: false };
      if (newBet > 0 && (me.saldo || 0) < newBet) return { ok: false, error: "Saldo insuficiente para esa apuesta." };
      // Devuelve los coins bloqueados por la apuesta original antes de crear la contraoferta.
      const origFromTeam = teams[c.fromTeamId];
      const fromCap = origFromTeam ? profiles[origFromTeam.captainId] : undefined;
      if (fromCap && c.betAmount && fromCap.lockedBets?.[c.id]) {
        const lockedBets = { ...fromCap.lockedBets };
        delete lockedBets[c.id];
        const updatedCap: Profile = {
          ...fromCap,
          saldo: (fromCap.saldo || 0) + c.betAmount,
          lockedCoins: Math.max(0, (fromCap.lockedCoins || 0) - c.betAmount),
          lockedBets,
        };
        setProfile(updatedCap);
        await pushProfileToCloud(getSupabase(), updatedCap);
      }
      const counterId = "ch_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      if (newBet > 0) {
        await saveProfile({
          ...me,
          saldo: (me.saldo || 0) - newBet,
          lockedCoins: (me.lockedCoins || 0) + newBet,
          lockedBets: { ...(me.lockedBets || {}), [counterId]: newBet },
        });
      }
      const counter: TeamChallenge = {
        id: counterId,
        fromTeamId: myTeam.id, toTeamId: c.fromTeamId, cancha: c.cancha, costo: c.costo, fecha: c.fecha, hora: c.hora,
        jugadores: c.jugadores, observaciones: c.observaciones, betAmount: newBet, status: "pendiente", createdAt: Date.now(),
        isCounteroffer: true, originalChallengeId: c.id,
      };
      const updatedOriginal: TeamChallenge = { ...c, status: "contraofertado" };
      challengesStore.set((prev) => [...prev.map((x) => (x.id === c.id ? updatedOriginal : x)), counter]);
      await pushChallengeToCloud(getSupabase(), counter);
      const fromTeam = teams[c.fromTeamId];
      if (fromTeam) {
        await notify(fromTeam.captainId, "🔄", `${myTeam.name} contraofertó tu reto${newBet > 0 ? ` con apuesta de ${newBet.toLocaleString("es-CO")} 🪙` : " sin apuesta"}.`);
      }
      return { ok: true };
    },
    [me, myTeam, challenges, teams, saveProfile, notify, profiles, setProfile]
  );

  const finalizeTeamMatch = useCallback(
    async (matchId: string, golesA: number, golesB: number, mvpId: string | null, playerStats: Record<string, MatchStatsInput>): Promise<ActionResult> => {
      const match = teamMatches.find((m) => m.id === matchId);
      if (!match || !me) return { ok: false };
      const teamA = teams[match.teamAId];
      const teamB = teams[match.teamBId];
      if (!teamA || !teamB || teamA.captainId !== me.id) return { ok: false };

      const updatedTeamA: Team = {
        ...teamA,
        goalsFor: teamA.goalsFor + golesA,
        goalsAgainst: teamA.goalsAgainst + golesB,
        wins: teamA.wins + (golesA > golesB ? 1 : 0),
        losses: teamA.losses + (golesA < golesB ? 1 : 0),
        draws: teamA.draws + (golesA === golesB ? 1 : 0),
      };
      const updatedTeamB: Team = {
        ...teamB,
        goalsFor: teamB.goalsFor + golesB,
        goalsAgainst: teamB.goalsAgainst + golesA,
        wins: teamB.wins + (golesB > golesA ? 1 : 0),
        losses: teamB.losses + (golesB < golesA ? 1 : 0),
        draws: teamB.draws + (golesA === golesB ? 1 : 0),
      };
      const resultLabel =
        golesA > golesB
          ? `${teamA.name} VENCIÓ A ${teamB.name} ${golesA}-${golesB}`
          : golesA < golesB
            ? `${teamB.name} VENCIÓ A ${teamA.name} ${golesB}-${golesA}`
            : `${teamA.name} EMPATÓ CON ${teamB.name} ${golesA}-${golesB}`;

      const sb = getSupabase();
      const headlines: string[] = [];
      for (const [pid, m2] of Object.entries(playerStats)) {
        const p = profiles[pid];
        if (!p) continue;
        const d = computeMatchDeltas(p, m2);
        const updatedP: Profile = { ...p, attrs: { ...p.attrs } };
        updatedP.ovr = d.ovrAfter;
        updatedP.xp = d.xpAfter;
        updatedP.lp = (p.lp || 0) + d.lpGain;
        updatedP.matches = (p.matches || 0) + 1;
        updatedP.goals = (p.goals || 0) + m2.goles;
        updatedP.assists = (p.assists || 0) + m2.asistencias;
        if (m2.mvp) updatedP.mvps = (p.mvps || 0) + 1;
        d.attrsGain.forEach((k) => {
          updatedP.attrs[k] = Math.min(99, updatedP.attrs[k] + 1);
        });
        updatedP.lastUpdate = { ovrDelta: d.ovrDelta, xpGain: d.xpGain, lpGain: d.lpGain };
        const newAchievements = checkAchievements(updatedP, m2, profiles);
        updatedP.history = [
          ...p.history,
          {
            date: new Date().toLocaleDateString("es-CO"), result: resultLabel, mvp: m2.mvp, ovrDelta: d.ovrDelta,
            goles: m2.goles, asistencias: m2.asistencias, calificacion: m2.calificacion,
            xpGain: d.xpGain, lpGain: d.lpGain,
          },
        ];
        const rankChanged = d.rankBefore.name !== d.rankAfter.name;
        updatedP.pendingReveal = {
          matchId: match.id, resultLabel, teamName: teamA.name, rivalName: teamB.name,
          ovrBefore: d.ovrBefore, ovrAfter: d.ovrAfter, xpGain: d.xpGain, lpGain: d.lpGain,
          rankBefore: d.rankBefore.name, rankAfter: d.rankAfter.name, rankChanged,
          isMvp: m2.mvp, achievementsNew: newAchievements, attrsGain: d.attrsGain,
        };
        setProfile(updatedP);
        await pushProfileToCloud(sb, updatedP);
        const name = updatedP.nickname || updatedP.name;
        if (d.ovrAfter > d.ovrBefore) headlines.push(`${name} evolucionó su Player Card a OVR ${d.ovrAfter}.`);
        if (rankChanged) headlines.push(`${name} ascendió al rango ${d.rankAfter.name}.`);
        if (m2.mvp) headlines.push(`${name} fue el MVP del partido.`);
      }

      const audience = new Set([...teamA.memberIds, ...teamB.memberIds].filter(Boolean) as string[]);
      for (const id of audience) {
        await notify(id, "⚽", resultLabel + ".");
        for (const h of headlines) await notify(id, "📈", h);
      }

      const updatedMatch: TeamMatch = { ...match, estado: "finalizado", resultado: { golesA, golesB }, mvpId };
      teamMatchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updatedMatch : m)));
      teamsStore.set((prev) => ({ ...prev, [teamA.id]: updatedTeamA, [teamB.id]: updatedTeamB }));
      await Promise.all([pushTeamMatchToCloud(sb, updatedMatch), pushTeamToCloud(sb, updatedTeamA), pushTeamToCloud(sb, updatedTeamB)]);
      return { ok: true };
    },
    [teamMatches, me, teams, profiles, setProfile, notify]
  );

  const ensureTeamPhoto = useCallback(
    async (teamId: string): Promise<boolean> => {
      const team = teams[teamId];
      if (!team || team.photo !== undefined) return false;
      const photo = await fetchTeamPhoto(getSupabase(), teamId);
      teamsStore.set((prev) => (prev[teamId] ? { ...prev, [teamId]: { ...prev[teamId], photo } } : prev));
      return true;
    },
    [teams]
  );

  // Puerto de crearPartidoTorneo (app.js ~6517-6542) — decisión B de Fase 5:
  // crear un cruce de torneo directo (sin reto/aceptación), disponible desde
  // la pestaña TORNEOS del Centro de Estadísticas y desde el modal ⚙ ADMIN.
  const createTournamentMatch = useCallback(
    async (input: { torneoId: string; teamAId: string; teamBId: string; fecha: string; hora: string; cancha: string }): Promise<ActionResult> => {
      if (!me) return { ok: false };
      if (!input.teamAId || !input.teamBId) return { ok: false, error: "Selecciona los dos equipos." };
      if (input.teamAId === input.teamBId) return { ok: false, error: "Los dos equipos deben ser distintos." };
      if (!input.fecha) return { ok: false, error: "Ingresa la fecha del partido." };
      const teamA = teams[input.teamAId];
      const teamB = teams[input.teamBId];
      if (!teamA || !teamB) return { ok: false };
      const match: TeamMatch = {
        id: "tm_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        teamAId: input.teamAId, teamBId: input.teamBId, cancha: input.cancha, costo: "",
        fecha: input.fecha, hora: input.hora, jugadores: "", observaciones: "",
        torneoId: input.torneoId,
        estado: "programado", resultado: null, mvpId: null, createdAt: Date.now(),
        stats: {}, notes: "",
      };
      teamMatchesStore.set((prev) => [...prev, match]);
      await pushTeamMatchToCloud(getSupabase(), match);
      return { ok: true };
    },
    [me, teams]
  );

  // Puerto de apCancelMatch (admin-partido.html ~778-785).
  const cancelTeamMatch = useCallback(
    async (matchId: string): Promise<ActionResult> => {
      const match = teamMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const updated: TeamMatch = { ...match, estado: "cancelado" };
      teamMatchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      await pushTeamMatchToCloud(getSupabase(), updated);
      return { ok: true };
    },
    [teamMatches]
  );

  // Puerto de apFinalizeMatch (admin-partido.html) — pieza 3 de Fase 5. Función
  // NUEVA y separada de finalizeTeamMatch (no la modifica, per corrección i).
  const adminFinalizeTeamMatch = useCallback(
    async (matchId: string, input: ApFinalizeInput): Promise<ActionResult> => {
      const match = teamMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      if (match.estado === "finalizado") return { ok: false, error: "Este partido ya fue registrado." };
      const teamA = teams[match.teamAId];
      const teamB = teams[match.teamBId];
      if (!teamA || !teamB) return { ok: false };
      const res = await finalizeTeamMatchAdmin(getSupabase(), match, teamA, teamB, profiles, input, setProfile);
      teamMatchesStore.set((prev) => prev.map((m) => (m.id === matchId ? res.match : m)));
      teamsStore.set((prev) => ({ ...prev, [teamA.id]: res.teamA, [teamB.id]: res.teamB }));
      return { ok: true };
    },
    [teamMatches, teams, profiles, setProfile]
  );

  // Puerto de apSaveCorrection — parche crudo, sin revertir/recalcular deltas.
  const adminCorrectTeamMatch = useCallback(
    async (matchId: string, input: ApFinalizeInput): Promise<ActionResult> => {
      const match = teamMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const updated = await correctTeamMatchAdmin(getSupabase(), match, profiles, input);
      teamMatchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      return { ok: true };
    },
    [teamMatches, profiles]
  );

  // Puerto de la rama esEquipo de statsHubSaveMatch (app.js ~7481-7555) —
  // motor de "revert preciso" del Centro de Estadísticas (pieza 4).
  const statsHubSaveTeamMatch = useCallback(
    async (matchId: string, input: StatsHubTeamSaveInput, correctionOnly: boolean): Promise<ActionResult> => {
      const match = teamMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const teamA = teams[match.teamAId];
      const teamB = teams[match.teamBId];
      if (!teamA || !teamB) return { ok: false };
      const res = await statsHubSaveTeamMatchPure(getSupabase(), match, teamA, teamB, profiles, input, correctionOnly, setProfile);
      teamMatchesStore.set((prev) => prev.map((m) => (m.id === matchId ? res.match : m)));
      teamsStore.set((prev) => ({ ...prev, [teamA.id]: res.teamA, [teamB.id]: res.teamB }));
      return { ok: true };
    },
    [teamMatches, teams, profiles, setProfile]
  );

  // Puerto de statsHubResetMatch (app.js ~7600-7628) para partidos de equipo.
  const statsHubResetTeamMatch = useCallback(
    async (matchId: string): Promise<ActionResult> => {
      const match = teamMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const teamA = teams[match.teamAId];
      const teamB = teams[match.teamBId];
      if (!teamA || !teamB) return { ok: false };
      const res = await statsHubResetTeamMatchPure(getSupabase(), match, teamA, teamB, profiles, setProfile);
      teamMatchesStore.set((prev) => prev.map((m) => (m.id === matchId ? res.match : m)));
      teamsStore.set((prev) => ({ ...prev, [teamA.id]: res.teamA, [teamB.id]: res.teamB }));
      return { ok: true };
    },
    [teamMatches, teams, profiles, setProfile]
  );

  const value = useMemo<TeamsContextValue>(
    () => ({
      teams, teamInvites, challenges, teamMatches, myTeam, myTeamInvites, myChallenges, myLeaveRequests,
      refresh, createTeam, editTeam, toggleOpenForPlayers, setSlotPosition, sendTeamInvite, respondTeamInvite,
      requestJoinTeam, respondJoinRequest, requestLeaveTeam, respondLeaveRequest, kickTeamMember,
      sendChallenge, respondChallenge, sendCounteroffer, finalizeTeamMatch, ensureTeamPhoto, cancelTeamMatch,
      createTournamentMatch, adminFinalizeTeamMatch, adminCorrectTeamMatch, statsHubSaveTeamMatch, statsHubResetTeamMatch,
    }),
    [
      teams, teamInvites, challenges, teamMatches, myTeam, myTeamInvites, myChallenges, myLeaveRequests,
      refresh, createTeam, editTeam, toggleOpenForPlayers, setSlotPosition, sendTeamInvite, respondTeamInvite,
      requestJoinTeam, respondJoinRequest, requestLeaveTeam, respondLeaveRequest, kickTeamMember,
      sendChallenge, respondChallenge, sendCounteroffer, finalizeTeamMatch, ensureTeamPhoto, cancelTeamMatch,
      createTournamentMatch, adminFinalizeTeamMatch, adminCorrectTeamMatch, statsHubSaveTeamMatch, statsHubResetTeamMatch,
    ]
  );

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}

export function useTeams(): TeamsContextValue {
  const ctx = useContext(TeamsContext);
  if (!ctx) throw new Error("useTeams debe usarse dentro de <TeamsProvider>");
  return ctx;
}
