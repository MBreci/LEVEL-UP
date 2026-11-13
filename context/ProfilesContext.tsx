"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { createLocalRawStore, createLocalStore } from "@/lib/localStore";
import { getSupabase } from "@/lib/supabase/client";
import { fetchProfilesFromCloud, fetchTotalPlayersFromCloud, normalizeProfile, rowToProfile } from "@/lib/domain/profiles";
import { useRegisterSync } from "@/context/SyncRegistry";
import type { Profile, ProfilesById } from "@/types/profile";

const profilesStore = createLocalStore<ProfilesById>("levelup_profiles", {});
// Guardado como string plano (no JSON), igual que la app original.
const totalPlayersStore = createLocalRawStore("levelup_total_players");

interface ProfilesContextValue {
  profiles: ProfilesById;
  totalPlayers: number | null;
  displayPlayerCount: () => number;
  setProfile: (p: Profile) => void;
  syncProfiles: (currentId: string | null) => Promise<void>;
  refreshTotalPlayers: () => Promise<void>;
}

const ProfilesContext = createContext<ProfilesContextValue | null>(null);

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const profiles = profilesStore.useValue();
  const totalPlayersRaw = totalPlayersStore.useValue();
  const totalPlayers = totalPlayersRaw != null && totalPlayersRaw !== "" ? parseInt(totalPlayersRaw, 10) : null;

  const setProfile = useCallback((p: Profile) => {
    profilesStore.set((prev) => ({ ...prev, [p.id]: normalizeProfile(p) }));
  }, []);

  const refreshTotalPlayers = useCallback(async () => {
    const count = await fetchTotalPlayersFromCloud(getSupabase());
    if (count != null) totalPlayersStore.set(String(count));
  }, []);

  const syncProfiles = useCallback(async (currentId: string | null) => {
    const rows = await fetchProfilesFromCloud(getSupabase());
    if (!rows) return;
    profilesStore.set((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        const fresh = normalizeProfile(rowToProfile(row));
        const prevEntry = next[row.id];
        if (prevEntry?.photo) fresh.photo = prevEntry.photo;
        if (prevEntry?.photoFull) fresh.photoFull = prevEntry.photoFull;
        if (prevEntry?.email) fresh.email = prevEntry.email;
        if (row.id === currentId) {
          const cloudNotifs = fresh.notifications || [];
          const seen = new Set(cloudNotifs.map((n) => n.icon + n.text + n.time));
          const localOnly = (prevEntry?.notifications || []).filter((n) => !seen.has(n.icon + n.text + n.time));
          fresh.notifications = [...cloudNotifs, ...localOnly];
          fresh.ratedPlayers = prevEntry?.ratedPlayers || {};
        }
        next[row.id] = fresh;
      });
      return next;
    });
  }, []);

  useRegisterSync(refreshTotalPlayers, [refreshTotalPlayers]);

  const displayPlayerCount = useCallback(() => {
    return totalPlayers != null ? totalPlayers : Object.keys(profiles).length;
  }, [totalPlayers, profiles]);

  const value = useMemo<ProfilesContextValue>(
    () => ({ profiles, totalPlayers, displayPlayerCount, setProfile, syncProfiles, refreshTotalPlayers }),
    [profiles, totalPlayers, displayPlayerCount, setProfile, syncProfiles, refreshTotalPlayers]
  );

  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}

export function useProfiles(): ProfilesContextValue {
  const ctx = useContext(ProfilesContext);
  if (!ctx) throw new Error("useProfiles debe usarse dentro de <ProfilesProvider>");
  return ctx;
}
