"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { createLocalRawStore } from "@/lib/localStore";
import { getSupabase } from "@/lib/supabase/client";
import { useRegisterSync } from "@/context/SyncRegistry";
import { useProfiles } from "@/context/ProfilesContext";
import {
  createProfileInCloud,
  isFounder as isFounderCheck,
  isRestrictedPlayer as isRestrictedPlayerCheck,
  makeProfile,
  pushProfileToCloud,
} from "@/lib/domain/profiles";
import {
  checkEmailAvailable,
  confirmPasswordReset,
  findProfileByIdentifier,
  hashPassword,
  isPasswordMediumStrength,
  requestPasswordResetCode,
  verifyLogin,
} from "@/lib/domain/auth";
import { containsProfanity } from "@/lib/domain/rank";
import { withTimeout } from "@/lib/withTimeout";
import type { Gender, NewProfileInput, Position, Profile } from "@/types/profile";

const currentIdStore = createLocalRawStore("levelup_current_profile");

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface RegisterInput {
  name: string;
  nickname: string;
  email: string;
  gender: Gender;
  position: Position;
  password: string;
  passwordConfirm: string;
  consent: boolean;
}

interface AuthContextValue {
  profile: Profile | null;
  isAdmin: boolean;
  isFounder: boolean;
  isRestrictedPlayer: boolean;
  login: (identifier: string, password: string) => Promise<ActionResult>;
  register: (input: RegisterInput) => Promise<ActionResult>;
  logout: () => void;
  requestReset: (email: string) => Promise<ActionResult>;
  confirmReset: (email: string, code: string, newPassword: string, newPasswordConfirm: string) => Promise<ActionResult>;
  saveProfile: (p: Profile) => Promise<void>;
  editNickname: () => Promise<void>;
  editDorsal: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { profiles, setProfile, syncProfiles } = useProfiles();
  const currentId = currentIdStore.useValue();

  // Sync inicial (equivalente a syncProfilesFromCloud() sin condicionar a sesión), más
  // el registro en el poll de 45s (que en el original solo corre mientras haya sesión).
  useEffect(() => {
    syncProfiles(currentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useRegisterSync(() => syncProfiles(currentId), [currentId, syncProfiles]);

  const profile = useMemo(() => (currentId ? profiles[currentId] ?? null : null), [currentId, profiles]);

  const setCurrentProfile = useCallback((id: string | null) => {
    currentIdStore.set(id);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string): Promise<ActionResult> => {
      if (!identifier.trim() || !password) {
        return { ok: false, error: "Escribe tu nombre o apodo y tu contraseña." };
      }
      const sb = getSupabase();
      const hash = await hashPassword(password);
      let found: Profile | null = null;
      try {
        found = await verifyLogin(sb, identifier, hash);
      } catch {
        return { ok: false, error: "No pudimos conectar con el servidor. Revisa tu internet o desactiva bloqueadores/VPN e inténtalo de nuevo." };
      }
      if (!found) {
        return { ok: false, error: "Nombre/apodo o contraseña incorrectos." };
      }
      setProfile(found);
      setCurrentProfile(found.id);
      return { ok: true };
    },
    [setProfile, setCurrentProfile]
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<ActionResult> => {
      const name = input.name.trim();
      const nickname = input.nickname.trim();
      const email = input.email.trim().toLowerCase();
      if (!name) return { ok: false, error: "Escribe tu nombre para crear tu carta." };
      if (!nickname) return { ok: false, error: "Escribe tu apodo: es tu identidad única en LEVEL UP." };
      if (containsProfanity(name) || containsProfanity(nickname)) {
        return { ok: false, error: "Tu nombre o apodo contiene lenguaje ofensivo. Por favor elige otro." };
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, error: "Escribe un correo electrónico válido para poder recuperar tu cuenta." };
      }
      if (!isPasswordMediumStrength(input.password)) {
        return { ok: false, error: "La contraseña debe tener mínimo 6 caracteres, con letras y números." };
      }
      if (input.password !== input.passwordConfirm) {
        return { ok: false, error: "Las contraseñas no coinciden." };
      }
      if (!input.consent) {
        return { ok: false, error: "Debes aceptar la Política de Tratamiento de Datos Personales y de Imagen para crear tu cuenta." };
      }

      const sb = getSupabase();
      try {
        const nickTaken = await withTimeout(findProfileByIdentifier(sb, profiles, nickname, true), 4000, "nick");
        if (nickTaken) return { ok: false, error: "Ese apodo ya está en uso. Elige uno diferente." };
      } catch {
        /* red intermitente/timeout: seguimos, la BD valida al insertar */
      }
      try {
        const available = await withTimeout(checkEmailAvailable(sb, email), 4000, "email");
        if (available === false) return { ok: false, error: "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña." };
      } catch {
        /* seguimos */
      }

      const passwordHash = await hashPassword(input.password);
      const newProfileInput: NewProfileInput = {
        name,
        position: input.position,
        nickname,
        email,
        gender: input.gender,
        passwordHash,
      };
      const newProfile = makeProfile(newProfileInput);

      let createErr: unknown = null;
      try {
        const res = await createProfileInCloud(sb, newProfile);
        createErr = res.error;
      } catch (e) {
        createErr = e;
      }
      if (createErr) {
        const msg = (createErr as { message?: string })?.message || "";
        const dup = /duplicate key|unique|constraint/i.test(msg);
        const dupEmail = /email/i.test(msg);
        return {
          ok: false,
          error: dup
            ? dupEmail
              ? "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña."
              : "Ese apodo se acaba de registrar. Elige otro."
            : "No pudimos crear la cuenta. Inténtalo de nuevo.",
        };
      }

      setProfile(newProfile);
      setCurrentProfile(newProfile.id);
      return { ok: true };
    },
    [profiles, setProfile, setCurrentProfile]
  );

  const logout = useCallback(() => {
    setCurrentProfile(null);
  }, [setCurrentProfile]);

  const requestReset = useCallback(async (email: string): Promise<ActionResult> => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false, error: "Escribe un correo válido." };
    }
    try {
      await requestPasswordResetCode(getSupabase(), trimmed);
      return { ok: true };
    } catch {
      return { ok: false, error: "No se pudo enviar el código. Inténtalo de nuevo." };
    }
  }, []);

  const confirmReset = useCallback(
    async (email: string, code: string, newPassword: string, newPasswordConfirm: string): Promise<ActionResult> => {
      if (!/^\d{6}$/.test(code)) {
        return { ok: false, error: "Escribe el código de 6 dígitos que te llegó al correo." };
      }
      if (!isPasswordMediumStrength(newPassword)) {
        return { ok: false, error: "La nueva contraseña debe tener mínimo 6 caracteres, con letras y números." };
      }
      if (newPassword !== newPasswordConfirm) {
        return { ok: false, error: "Las contraseñas no coinciden." };
      }
      const newHash = await hashPassword(newPassword);
      const { ok, error } = await confirmPasswordReset(getSupabase(), email, code, newHash);
      if (error) return { ok: false, error: "No se pudo procesar. Revisa tu conexión e inténtalo de nuevo." };
      if (!ok) return { ok: false, error: "Código incorrecto o vencido. Pide uno nuevo e inténtalo otra vez." };
      return { ok: true };
    },
    []
  );

  const saveProfile = useCallback(
    async (p: Profile) => {
      setProfile(p);
      const { error } = await pushProfileToCloud(getSupabase(), p);
      if (error) console.error("No se pudo guardar el perfil en la nube:", error);
    },
    [setProfile]
  );

  const editNickname = useCallback(async () => {
    if (!profile) return;
    const value = window.prompt("¿Cuál es tu apodo?", profile.nickname || "");
    if (value === null) return;
    const trimmed = value.trim();
    if (containsProfanity(trimmed)) {
      window.alert("Ese apodo contiene lenguaje ofensivo. Por favor elige otro.");
      return;
    }
    const newNick = trimmed.toUpperCase();
    if (newNick && newNick !== profile.nickname) {
      const sb = getSupabase();
      const taken = await findProfileByIdentifier(sb, profiles, newNick, true);
      if (taken && taken.id !== profile.id) {
        window.alert("Ese apodo ya está en uso. Elige otro.");
        return;
      }
    }
    const updated: Profile = { ...profile, nickname: newNick };
    setProfile(updated);
    const { error } = await pushProfileToCloud(getSupabase(), updated);
    if (error) {
      setProfile(profile);
      window.alert("Ese apodo se acaba de ocupar. Elige otro.");
    }
  }, [profile, profiles, setProfile]);

  const editDorsal = useCallback(async () => {
    if (!profile) return;
    const current = profile.dorsal === 0 || profile.dorsal ? String(profile.dorsal) : "";
    const value = window.prompt("¿Cuál es tu número? (del 1 al 99, deja vacío para quitarlo)", current);
    if (value === null) return;
    const trimmed = String(value).trim();
    let dorsal: number | null = null;
    if (trimmed !== "") {
      const n = parseInt(trimmed, 10);
      if (isNaN(n) || n < 0 || n > 99) {
        window.alert("Escribe un número válido entre 1 y 99.");
        return;
      }
      dorsal = n;
    }
    const updated: Profile = { ...profile, dorsal };
    setProfile(updated);
    const { error } = await pushProfileToCloud(getSupabase(), updated);
    if (error) {
      setProfile(profile);
      window.alert("No se pudo guardar tu número. Revisa tu conexión e inténtalo de nuevo.");
    }
  }, [profile, setProfile]);

  const isAdmin = !!profile?.isAdmin;
  const isFounder = isFounderCheck(profile);
  const isRestrictedPlayer = isRestrictedPlayerCheck(profile);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      isAdmin,
      isFounder,
      isRestrictedPlayer,
      login,
      register,
      logout,
      requestReset,
      confirmReset,
      saveProfile,
      editNickname,
      editDorsal,
    }),
    [
      profile,
      isAdmin,
      isFounder,
      isRestrictedPlayer,
      login,
      register,
      logout,
      requestReset,
      confirmReset,
      saveProfile,
      editNickname,
      editDorsal,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
