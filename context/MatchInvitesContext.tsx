"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { createLocalStore } from "@/lib/localStore";
import { getSupabase } from "@/lib/supabase/client";
import { useRegisterSync } from "@/context/SyncRegistry";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { fetchMatchInvitesFromCloud, pushMatchInviteToCloud } from "@/lib/domain/matchInvites";
import { pushProfileToCloud } from "@/lib/domain/profiles";
import type { DeviceMatchInvite } from "@/types/match";
import type { Profile } from "@/types/profile";

const matchInvitesStore = createLocalStore<DeviceMatchInvite[]>("levelup_invites", []);

interface MatchInvitesContextValue {
  invites: DeviceMatchInvite[];
  myInvites: DeviceMatchInvite[];
  sendInvite: (matchId: string, zona: string, fecha: string, toId: string, toName: string) => Promise<void>;
  respondInvite: (inviteId: string, accept: boolean) => Promise<void>;
}

const MatchInvitesContext = createContext<MatchInvitesContextValue | null>(null);

export function MatchInvitesProvider({ children }: { children: React.ReactNode }) {
  const { profile: me } = useAuth();
  const { profiles, setProfile } = useProfiles();
  const invites = matchInvitesStore.useValue();

  const refresh = useCallback(async () => {
    const fresh = await fetchMatchInvitesFromCloud(getSupabase());
    if (!fresh) return;
    matchInvitesStore.set((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i]));
      fresh.forEach((i) => byId.set(i.id, i));
      return Array.from(byId.values());
    });
  }, []);

  useRegisterSync(refresh, [refresh]);
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myInvites = useMemo(() => (me ? invites.filter((i) => i.toId === me.id) : []), [invites, me]);

  const sendInvite = useCallback(
    async (matchId: string, zona: string, fecha: string, toId: string, toName: string) => {
      if (!me) return;
      const invite: DeviceMatchInvite = {
        id: "inv_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        matchId, zona, fecha, fromId: me.id, fromName: me.nickname || me.name, toId, toName, status: "pendiente",
      };
      matchInvitesStore.set((prev) => [...prev, invite]);
      await pushMatchInviteToCloud(getSupabase(), invite);
    },
    [me]
  );

  const respondInvite = useCallback(
    async (inviteId: string, accept: boolean) => {
      if (!me) return;
      const invite = invites.find((i) => i.id === inviteId);
      if (!invite) return;
      const updated: DeviceMatchInvite = { ...invite, status: accept ? "aceptada" : "rechazada" };
      matchInvitesStore.set((prev) => prev.map((i) => (i.id === inviteId ? updated : i)));
      await pushMatchInviteToCloud(getSupabase(), updated);
      const fromProfile = profiles[invite.fromId];
      if (fromProfile) {
        const updatedFrom: Profile = {
          ...fromProfile,
          notifications: [
            ...fromProfile.notifications,
            { icon: accept ? "✅" : "❌", text: `${me.nickname || me.name} ${accept ? "aceptó" : "rechazó"} tu invitación al partido en ${invite.zona} — ${invite.fecha}.`, time: "AHORA" },
          ],
        };
        setProfile(updatedFrom);
        await pushProfileToCloud(getSupabase(), updatedFrom);
      }
    },
    [me, invites, profiles, setProfile]
  );

  const value = useMemo(() => ({ invites, myInvites, sendInvite, respondInvite }), [invites, myInvites, sendInvite, respondInvite]);

  return <MatchInvitesContext.Provider value={value}>{children}</MatchInvitesContext.Provider>;
}

export function useMatchInvites(): MatchInvitesContextValue {
  const ctx = useContext(MatchInvitesContext);
  if (!ctx) throw new Error("useMatchInvites debe usarse dentro de <MatchInvitesProvider>");
  return ctx;
}
