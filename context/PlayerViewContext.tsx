"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { fetchPlayerProfileFromCloud, normalizeProfile, rowToProfile } from "@/lib/domain/profiles";
import { getSupabase } from "@/lib/supabase/client";

interface PlayerViewContextValue {
  viewingId: string | null;
  loading: boolean;
  openPlayerView: (id: string) => Promise<void>;
  closePlayerView: () => void;
}

const PlayerViewContext = createContext<PlayerViewContextValue | null>(null);

export function PlayerViewProvider({ children }: { children: React.ReactNode }) {
  const { profile: me } = useAuth();
  const { setProfile } = useProfiles();
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openPlayerView = useCallback(
    async (id: string) => {
      setViewingId(id);
      setLoading(true);
      try {
        const row = await fetchPlayerProfileFromCloud(getSupabase(), id);
        if (row) {
          const fresh = normalizeProfile(rowToProfile(row));
          // El sync masivo preserva el correo local; aquí replicamos lo mismo para
          // no pisar el correo del propio perfil si estoy viendo mi propia ficha.
          if (me && me.id === id && me.email) fresh.email = me.email;
          setProfile(fresh);
        }
      } finally {
        setLoading(false);
      }
    },
    [me, setProfile]
  );

  const closePlayerView = useCallback(() => setViewingId(null), []);

  const value = useMemo(() => ({ viewingId, loading, openPlayerView, closePlayerView }), [viewingId, loading, openPlayerView, closePlayerView]);

  return <PlayerViewContext.Provider value={value}>{children}</PlayerViewContext.Provider>;
}

export function usePlayerView(): PlayerViewContextValue {
  const ctx = useContext(PlayerViewContext);
  if (!ctx) throw new Error("usePlayerView debe usarse dentro de <PlayerViewProvider>");
  return ctx;
}
