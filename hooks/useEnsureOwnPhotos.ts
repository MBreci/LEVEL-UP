"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { getSupabase } from "@/lib/supabase/client";

/**
 * El sync masivo de perfiles NUNCA trae `photo`/`photo_full` (ahorro de egress),
 * así que la foto que sube el admin no aparecería en la propia carta sin esto.
 * Se trae una sola vez por sesión (no en cada render).
 */
export function useEnsureOwnPhotos(): void {
  const { profile } = useAuth();
  const { setProfile } = useProfiles();
  const fetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || fetchedFor.current === profile.id) return;
    fetchedFor.current = profile.id;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getSupabase().from("profiles").select("photo,photo_full").eq("id", profile.id).single();
        if (cancelled || !data) return;
        const photo = data.photo || null;
        const photoFull = data.photo_full || null;
        if (photo !== (profile.photo || null) || photoFull !== (profile.photoFull || null)) {
          setProfile({ ...profile, photo, photoFull });
        }
      } catch {
        /* sin conexión: seguimos con la foto ya cacheada localmente */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, setProfile]);
}
