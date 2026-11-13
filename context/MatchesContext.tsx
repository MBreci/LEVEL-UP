"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { createLocalStore } from "@/lib/localStore";
import { getSupabase } from "@/lib/supabase/client";
import {
  deleteMatchFromCloud,
  fetchMatchFromCloud,
  fetchOpenMatchesFromCloud,
  getMatchEstado,
  getTotalCupos,
  getTotalUnidos,
  matchDateTime,
  pushMatchToCloud,
} from "@/lib/domain/matches";
import { buildMatchFromWizard, type BpWizardState } from "@/lib/domain/matchWizard";
import { pushProfileToCloud } from "@/lib/domain/profiles";
import { correctOpenMatchAdmin, finalizeOpenMatchAdmin, type AdminOpenMatchFormInput } from "@/lib/domain/adminOpenMatch";
import {
  statsHubResetOpenMatch as statsHubResetOpenMatchPure,
  statsHubSaveOpenMatch as statsHubSaveOpenMatchPure,
  type StatsHubLibreSaveInput,
} from "@/lib/domain/adminStatsHub";
import { useRegisterSync } from "@/context/SyncRegistry";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import type { OpenMatch } from "@/types/match";
import type { Profile } from "@/types/profile";

const matchesStore = createLocalStore<OpenMatch[]>("levelup_open_matches", []);
const savedMatchIdsStore = createLocalStore<string[]>("levelup_saved_matches", []);
const RECENT_MS = 3 * 60 * 1000;
const FREE_MATCH_XP = 50;
const freeMatchXpGivenStore = createLocalStore<string[]>("levelup_fmxp_given", []);

export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface MatchesContextValue {
  openMatches: OpenMatch[];
  savedMatchIds: string[];
  refresh: () => Promise<void>;
  createMatch: (wizard: BpWizardState) => Promise<ActionResult>;
  confirmJoin: (matchId: string, pos: string) => Promise<ActionResult>;
  respondJoinRequest: (matchId: string, profileId: string, accept: boolean) => Promise<void>;
  cancelParticipation: (matchId: string) => Promise<ActionResult>;
  deleteMatch: (matchId: string) => Promise<ActionResult>;
  toggleSaveMatch: (matchId: string) => void;
  fetchSharedMatch: (matchId: string) => Promise<OpenMatch | null>;
  adminFinalizeOpenMatch: (matchId: string, input: AdminOpenMatchFormInput) => Promise<ActionResult>;
  adminCorrectOpenMatch: (matchId: string, input: Pick<AdminOpenMatchFormInput, "stats" | "calificaciones" | "mvpId" | "notes">) => Promise<ActionResult>;
  statsHubSaveOpenMatch: (matchId: string, input: StatsHubLibreSaveInput, correctionOnly: boolean) => Promise<ActionResult>;
  statsHubResetOpenMatch: (matchId: string) => Promise<ActionResult>;
}

const MatchesContext = createContext<MatchesContextValue | null>(null);

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { profiles, setProfile } = useProfiles();
  const openMatches = matchesStore.useValue();
  const savedMatchIds = savedMatchIdsStore.useValue();

  const refresh = useCallback(async () => {
    const fresh = await fetchOpenMatchesFromCloud(getSupabase());
    if (!fresh) return;
    const cloudIds = new Set(fresh.map((m) => m.id));
    const myId = profile?.id;
    matchesStore.set((prev) => {
      // Conserva un partido local solo si está en la nube, o si lo creé yo y es muy
      // reciente (aún no ha terminado de subir); si lo borré/cancelé en la nube, desaparece.
      const kept = prev.filter(
        (m) => cloudIds.has(m.id) || (m.creatorId === myId && Date.now() - (m.createdAt || 0) < RECENT_MS)
      );
      const byId = new Map(kept.map((m) => [m.id, m]));
      fresh.forEach((m) => byId.set(m.id, m));
      return Array.from(byId.values());
    });
  }, [profile?.id]);

  useRegisterSync(refresh, [refresh]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Da XP fija (sin OVR/LP) a todos los inscritos de un partido modo libre que se
  // completó, una sola vez por partido — no requiere admin, es automático al vencer.
  const grantFreeMatchXP = useCallback(
    async (match: OpenMatch) => {
      const given = freeMatchXpGivenStore.getSnapshot();
      if (given.includes(match.id)) return;
      freeMatchXpGivenStore.set([...given, match.id]);

      const totalCupos = getTotalCupos(match);
      const totalUnidos = getTotalUnidos(match);
      if (totalUnidos < totalCupos) return;

      const playerIds = match.necesita.flatMap((n) => n.unidos.map((u) => u.profileId)).filter(Boolean);
      for (const pid of playerIds) {
        const p = profiles[pid];
        if (!p) continue;
        const updated: Profile = {
          ...p,
          xp: (p.xp || 0) + FREE_MATCH_XP,
          matches: (p.matches || 0) + 1,
          lastUpdate: p.lastUpdate,
          notifications: [
            ...p.notifications,
            { icon: "⚡", text: `+${FREE_MATCH_XP} XP por participar en el partido del ${match.fecha}.`, time: "AHORA" },
          ],
        };
        setProfile(updated);
        await pushProfileToCloud(getSupabase(), updated);
      }
    },
    [profiles, setProfile]
  );

  const archiveExpired = useCallback(() => {
    matchesStore.set((prev) => {
      let changed = false;
      const next = prev.map((m) => {
        if (!m.finalizado && getMatchEstado(m) === "finalizado") {
          changed = true;
          grantFreeMatchXP(m);
          return { ...m, finalizado: true };
        }
        return m;
      });
      return changed ? next : prev;
    });
  }, [grantFreeMatchXP]);

  useRegisterSync(archiveExpired, [archiveExpired]);
  useEffect(() => {
    archiveExpired();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMatches.length]);

  const createMatch = useCallback(
    async (wizard: BpWizardState): Promise<ActionResult> => {
      if (!profile) return { ok: false, error: "Inicia sesión para crear un partido." };
      const { match, error } = buildMatchFromWizard(wizard, { id: profile.id, name: profile.nickname || profile.name }, openMatches);
      if (error || !match) return { ok: false, error: error || "No se pudo crear el partido." };
      matchesStore.set((prev) => [match, ...prev]);
      await pushMatchToCloud(getSupabase(), match);
      // Notifica a los amigos ya confirmados al crear el partido.
      for (const inv of wizard.invitados) {
        const player = profiles[inv.profileId];
        if (!player) continue;
        const lugar = match.cancha || "la cancha";
        const updated: Profile = {
          ...player,
          notifications: [
            ...player.notifications,
            { icon: "⚽", text: `${profile.nickname || profile.name} te confirmó en su partido en ${lugar} — ${match.fecha}.`, time: "AHORA" },
          ],
        };
        setProfile(updated);
        await pushProfileToCloud(getSupabase(), updated);
      }
      return { ok: true };
    },
    [profile, profiles, openMatches, setProfile]
  );

  const joinDirect = useCallback(
    async (matchId: string, pos: string): Promise<ActionResult> => {
      if (!profile) return { ok: false, error: "Inicia sesión para unirte." };
      let joined = false;
      matchesStore.set((prev) =>
        prev.map((m) => {
          if (m.id !== matchId) return m;
          const slot = m.necesita.find((n) => n.pos === pos);
          if (!slot || slot.unidos.length >= slot.cupos) return m;
          if (slot.unidos.some((u) => u.profileId === profile.id)) return m;
          joined = true;
          return {
            ...m,
            necesita: m.necesita.map((n) =>
              n.pos === pos ? { ...n, unidos: [...n.unidos, { profileId: profile.id, name: profile.nickname || profile.name }] } : n
            ),
          };
        })
      );
      if (!joined) return { ok: false };
      const updatedMatch = matchesStore.getSnapshot().find((m) => m.id === matchId);
      if (updatedMatch) await pushMatchToCloud(getSupabase(), updatedMatch);
      setProfile({
        ...profile,
        notifications: [...profile.notifications, { icon: "⚽", text: `Te uniste a un partido — ${updatedMatch?.fecha || ""}`, time: "AHORA" }],
      });
      return { ok: true };
    },
    [profile, setProfile]
  );

  const confirmJoin = useCallback(
    async (matchId: string, pos: string): Promise<ActionResult> => {
      if (!profile) return { ok: false, error: "Inicia sesión para unirte." };
      const match = openMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const slot = match.necesita.find((n) => n.pos === pos);
      if (!slot || slot.unidos.length >= slot.cupos) return { ok: false };

      if (match.abierto === false) {
        if (match.joinRequests.some((r) => r.profileId === profile.id)) return { ok: true };
        const updated: OpenMatch = {
          ...match,
          joinRequests: [...match.joinRequests, { profileId: profile.id, name: profile.nickname || profile.name, pos }],
        };
        matchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
        await pushMatchToCloud(getSupabase(), updated);
        const creator = profiles[match.creatorId];
        if (creator) {
          const updatedCreator: Profile = {
            ...creator,
            notifications: [
              ...creator.notifications,
              { icon: "🙋", text: `${profile.nickname || profile.name} solicitó unirse a tu partido (${pos}) — ${match.fecha}.`, time: "AHORA" },
            ],
          };
          setProfile(updatedCreator);
          await pushProfileToCloud(getSupabase(), updatedCreator);
        }
        return { ok: true };
      }
      return joinDirect(matchId, pos);
    },
    [profile, openMatches, profiles, setProfile, joinDirect]
  );

  const respondJoinRequest = useCallback(
    async (matchId: string, profileId: string, accept: boolean) => {
      if (!profile) return;
      const match = openMatches.find((m) => m.id === matchId);
      if (!match || match.creatorId !== profile.id) return;
      const req = match.joinRequests.find((r) => r.profileId === profileId);
      if (!req) return;
      const updated: OpenMatch = {
        ...match,
        joinRequests: match.joinRequests.filter((r) => r.profileId !== profileId),
        necesita:
          accept
            ? match.necesita.map((n) =>
                n.pos === req.pos && n.unidos.length < n.cupos && !n.unidos.some((u) => u.profileId === profileId)
                  ? { ...n, unidos: [...n.unidos, { profileId, name: req.name }] }
                  : n
              )
            : match.necesita,
      };
      matchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      await pushMatchToCloud(getSupabase(), updated);
      const player = profiles[profileId];
      if (player) {
        const updatedPlayer: Profile = {
          ...player,
          notifications: [
            ...player.notifications,
            { icon: accept ? "✅" : "❌", text: `Tu solicitud para el partido en ${match.zona} (${req.pos}) fue ${accept ? "aceptada" : "rechazada"}.`, time: "AHORA" },
          ],
        };
        setProfile(updatedPlayer);
        await pushProfileToCloud(getSupabase(), updatedPlayer);
      }
    },
    [profile, openMatches, profiles, setProfile]
  );

  const cancelParticipation = useCallback(
    async (matchId: string): Promise<ActionResult> => {
      if (!profile) return { ok: false };
      const match = openMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const hoursLeft = (matchDateTime(match).getTime() - Date.now()) / 3600000;
      if (hoursLeft < 24) return { ok: false, error: "Solo puedes cancelar tu asistencia con un mínimo de 24 horas de anticipación." };
      const updated: OpenMatch = {
        ...match,
        necesita: match.necesita.map((n) => ({ ...n, unidos: n.unidos.filter((u) => u.profileId !== profile.id) })),
        prioritario: true,
      };
      matchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      await pushMatchToCloud(getSupabase(), updated);
      const creator = profiles[match.creatorId];
      if (creator && creator.id !== profile.id) {
        const updatedCreator: Profile = {
          ...creator,
          notifications: [
            ...creator.notifications,
            {
              icon: "⚠️",
              text: `${profile.nickname || profile.name} se bajó de tu partido del ${match.fecha}. Quedó un cupo libre — tu partido está ahora en PRIORITARIO.`,
              time: "AHORA",
            },
          ],
        };
        setProfile(updatedCreator);
        await pushProfileToCloud(getSupabase(), updatedCreator);
      }
      setProfile({
        ...profile,
        notifications: [...profile.notifications, { icon: "🚫", text: `Cancelaste tu participación en el partido del ${match.fecha}.`, time: "AHORA" }],
      });
      return { ok: true };
    },
    [profile, openMatches, profiles, setProfile]
  );

  const deleteMatch = useCallback(
    async (matchId: string): Promise<ActionResult> => {
      if (!profile) return { ok: false };
      const match = openMatches.find((m) => m.id === matchId);
      if (!match || match.creatorId !== profile.id) return { ok: false };
      if ((matchDateTime(match).getTime() - Date.now()) / 3600000 < 24) {
        return { ok: false, error: "No puedes eliminar este partido porque inicia en menos de 24 horas." };
      }
      const joinedIds = new Set(match.necesita.flatMap((n) => n.unidos.map((u) => u.profileId)));
      for (const id of joinedIds) {
        const player = profiles[id];
        if (!player) continue;
        const updated: Profile = {
          ...player,
          notifications: [
            ...player.notifications,
            { icon: "🚫", text: `${profile.nickname || profile.name} eliminó el partido del ${match.fecha} en ${match.zona}.`, time: "AHORA" },
          ],
        };
        setProfile(updated);
        await pushProfileToCloud(getSupabase(), updated);
      }
      matchesStore.set((prev) => prev.filter((m) => m.id !== matchId));
      await deleteMatchFromCloud(getSupabase(), matchId, profile.id);
      return { ok: true };
    },
    [profile, openMatches, profiles, setProfile]
  );

  const toggleSaveMatch = useCallback((matchId: string) => {
    savedMatchIdsStore.set((prev) => (prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]));
  }, []);

  const fetchSharedMatch = useCallback(async (matchId: string): Promise<OpenMatch | null> => {
    const local = matchesStore.getSnapshot().find((m) => m.id === matchId);
    if (local) return local;
    const remote = await fetchMatchFromCloud(getSupabase(), matchId);
    if (remote) matchesStore.set((prev) => [...prev, remote]);
    return remote;
  }, []);

  // Puerto de adminFinalizeMatch (app.js ~8118) — consola admin de Modo Libre
  // (pieza 2 de Fase 5). Aplica deltas OVR/XP/LP + historial y marca finalizado.
  const adminFinalizeOpenMatch = useCallback(
    async (matchId: string, input: AdminOpenMatchFormInput): Promise<ActionResult> => {
      const match = openMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      if (match.finalizado) return { ok: false, error: "Este partido ya fue registrado." };
      const updated = await finalizeOpenMatchAdmin(getSupabase(), match, profiles, input, setProfile);
      matchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      return { ok: true };
    },
    [openMatches, profiles, setProfile]
  );

  // Puerto de adminSaveCorrection (app.js ~8232) — parche crudo, sin revertir deltas.
  const adminCorrectOpenMatch = useCallback(
    async (matchId: string, input: Pick<AdminOpenMatchFormInput, "stats" | "calificaciones" | "mvpId" | "notes">): Promise<ActionResult> => {
      const match = openMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const updated = await correctOpenMatchAdmin(getSupabase(), match, input);
      matchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      return { ok: true };
    },
    [openMatches]
  );

  // Puerto de la rama Modo Libre de statsHubSaveMatch (app.js ~7556-7589) —
  // motor de "revert preciso" del Centro de Estadísticas (pieza 4).
  const statsHubSaveOpenMatch = useCallback(
    async (matchId: string, input: StatsHubLibreSaveInput, correctionOnly: boolean): Promise<ActionResult> => {
      const match = openMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const updated = await statsHubSaveOpenMatchPure(getSupabase(), match, profiles, input, correctionOnly, setProfile);
      matchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      return { ok: true };
    },
    [openMatches, profiles, setProfile]
  );

  // Puerto de statsHubResetMatch (app.js ~7600-7628) para Modo Libre.
  const statsHubResetOpenMatch = useCallback(
    async (matchId: string): Promise<ActionResult> => {
      const match = openMatches.find((m) => m.id === matchId);
      if (!match) return { ok: false };
      const updated = await statsHubResetOpenMatchPure(getSupabase(), match, profiles, setProfile);
      matchesStore.set((prev) => prev.map((m) => (m.id === matchId ? updated : m)));
      return { ok: true };
    },
    [openMatches, profiles, setProfile]
  );

  const value = useMemo<MatchesContextValue>(
    () => ({
      openMatches,
      savedMatchIds,
      refresh,
      createMatch,
      confirmJoin,
      respondJoinRequest,
      cancelParticipation,
      deleteMatch,
      toggleSaveMatch,
      fetchSharedMatch,
      adminFinalizeOpenMatch,
      adminCorrectOpenMatch,
      statsHubSaveOpenMatch,
      statsHubResetOpenMatch,
    }),
    [
      openMatches,
      savedMatchIds,
      refresh,
      createMatch,
      confirmJoin,
      respondJoinRequest,
      cancelParticipation,
      deleteMatch,
      toggleSaveMatch,
      fetchSharedMatch,
      adminFinalizeOpenMatch,
      adminCorrectOpenMatch,
      statsHubSaveOpenMatch,
      statsHubResetOpenMatch,
    ]
  );

  return <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>;
}

export function useMatches(): MatchesContextValue {
  const ctx = useContext(MatchesContext);
  if (!ctx) throw new Error("useMatches debe usarse dentro de <MatchesProvider>");
  return ctx;
}
