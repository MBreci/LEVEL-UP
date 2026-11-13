"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { pushProfileToCloud } from "@/lib/domain/profiles";
import { getSupabase } from "@/lib/supabase/client";
import type { Profile } from "@/types/profile";

export const RATE_CATEGORIES = ["puntualidad", "tecnica", "comportamiento", "nivel"] as const;
export type RateCategory = (typeof RATE_CATEGORIES)[number];

interface RateModalContextValue {
  targetId: string | null;
  stars: Record<RateCategory, number>;
  error: string;
  open: (targetId: string) => void;
  close: () => void;
  setStar: (cat: RateCategory, val: number) => void;
  submit: () => Promise<void>;
}

const RateModalContext = createContext<RateModalContextValue | null>(null);

const EMPTY_STARS: Record<RateCategory, number> = { puntualidad: 0, tecnica: 0, comportamiento: 0, nivel: 0 };

export function RateModalProvider({ children }: { children: React.ReactNode }) {
  const { profile: me, saveProfile } = useAuth();
  const { profiles, setProfile } = useProfiles();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [stars, setStars] = useState<Record<RateCategory, number>>(EMPTY_STARS);
  const [error, setError] = useState("");

  const open = useCallback((id: string) => {
    setTargetId(id);
    setStars(EMPTY_STARS);
    setError("");
  }, []);

  const close = useCallback(() => {
    setTargetId(null);
  }, []);

  const setStar = useCallback((cat: RateCategory, val: number) => {
    setStars((prev) => ({ ...prev, [cat]: val }));
  }, []);

  const submit = useCallback(async () => {
    if (!targetId || !me) return;
    for (const cat of RATE_CATEGORIES) {
      if (!stars[cat]) {
        setError("Califica todos los criterios antes de enviar.");
        return;
      }
    }
    const target = profiles[targetId];
    if (!target) return;
    const ratings = { ...(target.communityRatings || {}) };
    RATE_CATEGORIES.forEach((cat) => {
      const prev = ratings[cat] || { sum: 0, count: 0 };
      ratings[cat] = { sum: prev.sum + stars[cat], count: prev.count + 1 };
    });
    const updatedTarget: Profile = { ...target, communityRatings: ratings };
    const updatedMe: Profile = { ...me, ratedPlayers: { ...(me.ratedPlayers || {}), [targetId]: Date.now() } };
    setProfile(updatedTarget);
    await saveProfile(updatedMe);
    await pushProfileToCloud(getSupabase(), updatedTarget);
    close();
    window.alert(`✅ Calificación enviada a ${target.nickname || target.name}.`);
  }, [targetId, me, stars, profiles, setProfile, saveProfile, close]);

  const value = useMemo(() => ({ targetId, stars, error, open, close, setStar, submit }), [targetId, stars, error, open, close, setStar, submit]);

  return <RateModalContext.Provider value={value}>{children}</RateModalContext.Provider>;
}

export function useRateModal(): RateModalContextValue {
  const ctx = useContext(RateModalContext);
  if (!ctx) throw new Error("useRateModal debe usarse dentro de <RateModalProvider>");
  return ctx;
}
