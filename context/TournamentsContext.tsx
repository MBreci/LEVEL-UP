"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { createLocalStore } from "@/lib/localStore";
import { getSupabase } from "@/lib/supabase/client";
import { useRegisterSync } from "@/context/SyncRegistry";
import { useAuth } from "@/context/AuthContext";
import {
  addTeamToTournamentInCloud,
  deleteTournamentInCloud,
  fetchTournamentsFromCloud,
  pushTournamentToCloud,
  setTournamentStatusInCloud,
  TN_TEAM_SIZE,
} from "@/lib/domain/tournaments";
import type { Tournament, TournamentStatus, TournamentTeamEntry } from "@/types/tournament";

const tournamentsStore = createLocalStore<Record<string, Tournament>>("levelup_tournaments", {});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface NewTournamentInput {
  nombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cancha: string;
  direccion: string;
  valorPorJugador: number;
  premio1: string;
  premio2: string;
  premio3: string;
  obs: string;
}

interface TournamentsContextValue {
  tournaments: Record<string, Tournament>;
  createTournament: (input: NewTournamentInput) => Promise<ActionResult>;
  changeStatus: (id: string, status: TournamentStatus) => Promise<void>;
  removeTournament: (id: string) => Promise<void>;
  registerTeam: (id: string, entry: TournamentTeamEntry) => Promise<ActionResult>;
}

const TournamentsContext = createContext<TournamentsContextValue | null>(null);

export function TournamentsProvider({ children }: { children: React.ReactNode }) {
  const { profile: me } = useAuth();
  const tournaments = tournamentsStore.useValue();

  const refresh = useCallback(async () => {
    const fresh = await fetchTournamentsFromCloud(getSupabase());
    if (!fresh) return;
    const map: Record<string, Tournament> = {};
    fresh.forEach((t) => {
      map[t.id] = t;
    });
    tournamentsStore.set(map);
  }, []);

  useRegisterSync(refresh, [refresh]);
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createTournament = useCallback(
    async (input: NewTournamentInput): Promise<ActionResult> => {
      if (!me) return { ok: false, error: "Inicia sesión para crear un torneo." };
      if (!input.nombre.trim()) return { ok: false, error: "El nombre del torneo es obligatorio." };
      if (!input.fecha) return { ok: false, error: "La fecha es obligatoria." };
      if (!input.horaInicio) return { ok: false, error: "La hora de inicio es obligatoria." };
      if (!input.cancha) return { ok: false, error: "Selecciona una cancha." };
      if (!input.premio1.trim()) return { ok: false, error: "El primer premio es obligatorio." };

      const valorInscripcion = input.valorPorJugador * TN_TEAM_SIZE;
      const t: Tournament = {
        id: "tn_" + Date.now(),
        nombre: input.nombre.trim(),
        fecha: input.fecha,
        horaInicio: input.horaInicio,
        horaFin: input.horaFin,
        cancha: input.cancha,
        direccion: input.direccion.trim(),
        valorPorJugador: input.valorPorJugador,
        valorInscripcion,
        premio: input.premio1.trim(),
        premio1: input.premio1.trim(),
        premio2: input.premio2.trim(),
        premio3: input.premio3.trim(),
        obs: input.obs.trim(),
        createdBy: me.id,
        status: "abierto",
        teams: [],
        createdAt: Date.now(),
      };
      tournamentsStore.set((prev) => ({ ...prev, [t.id]: t }));
      const { error } = await pushTournamentToCloud(getSupabase(), me.id, t);
      if (error) return { ok: false, error: "Se guardó localmente pero no se pudo publicar en la nube. Revisa tu conexión." };
      return { ok: true };
    },
    [me]
  );

  const changeStatus = useCallback(
    async (id: string, status: TournamentStatus) => {
      if (!me) return;
      const t = tournaments[id];
      if (!t) return;
      tournamentsStore.set((prev) => ({ ...prev, [id]: { ...t, status } }));
      await setTournamentStatusInCloud(getSupabase(), me.id, id, status);
    },
    [me, tournaments]
  );

  const removeTournament = useCallback(
    async (id: string) => {
      if (!me) return;
      tournamentsStore.set((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await deleteTournamentInCloud(getSupabase(), me.id, id);
    },
    [me]
  );

  const registerTeam = useCallback(
    async (id: string, entry: TournamentTeamEntry): Promise<ActionResult> => {
      if (!me) return { ok: false };
      const t = tournaments[id];
      if (!t) return { ok: false };
      tournamentsStore.set((prev) => ({ ...prev, [id]: { ...t, teams: [...(t.teams || []), entry] } }));
      const { error, tournament } = await addTeamToTournamentInCloud(getSupabase(), me.id, id, entry);
      if (tournament) tournamentsStore.set((prev) => ({ ...prev, [id]: tournament }));
      if (error) return { ok: false, error: "No se pudo confirmar la inscripción en la nube." };
      return { ok: true };
    },
    [me, tournaments]
  );

  const value = useMemo<TournamentsContextValue>(
    () => ({ tournaments, createTournament, changeStatus, removeTournament, registerTeam }),
    [tournaments, createTournament, changeStatus, removeTournament, registerTeam]
  );

  return <TournamentsContext.Provider value={value}>{children}</TournamentsContext.Provider>;
}

export function useTournaments(): TournamentsContextValue {
  const ctx = useContext(TournamentsContext);
  if (!ctx) throw new Error("useTournaments debe usarse dentro de <TournamentsProvider>");
  return ctx;
}
