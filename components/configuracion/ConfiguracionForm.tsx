"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase/client";
import { changeMyPassword, hashPassword, isPasswordMediumStrength, setMyEmail } from "@/lib/domain/auth";
import { pushProfileToCloud } from "@/lib/domain/profiles";

export function ConfiguracionForm() {
  const { profile, saveProfile, logout } = useAuth();
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [errorOk, setErrorOk] = useState(false);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passOk, setPassOk] = useState(false);

  // Carga los campos del formulario desde el perfil ajustando el estado durante
  // el render (en vez de con un efecto) cada vez que cambia de perfil.
  const [loadedForId, setLoadedForId] = useState<string | null>(null);
  if (profile && profile.id !== loadedForId) {
    setLoadedForId(profile.id);
    setNickname(profile.nickname || "");
    setDorsal(profile.dorsal === 0 || profile.dorsal ? String(profile.dorsal) : "");
    setEmail(profile.email || "");
  }

  if (!profile) return null;

  async function submitConfig() {
    setErrorOk(false);
    const newNick = nickname.trim().toUpperCase();
    const newEmail = email.trim().toLowerCase();
    if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError("Escribe un correo válido.");
      return;
    }
    const dorsalRaw = dorsal.trim();
    let newDorsal: number | null = null;
    if (dorsalRaw !== "") {
      const n = parseInt(dorsalRaw, 10);
      if (isNaN(n) || n < 1 || n > 99) {
        setError("Tu número debe estar entre 1 y 99.");
        return;
      }
      newDorsal = n;
    }
    const updated = { ...profile!, nickname: newNick, dorsal: newDorsal };
    const res = await pushProfileToCloud(getSupabase(), updated);
    if (res.error) {
      const msg = (res.error as { message?: string })?.message || "";
      const dup = /duplicate key|unique/i.test(msg);
      setError(
        dup
          ? "Ese apodo ya está en uso."
          : "No pudimos conectar con el servidor. Revisa tu internet, desactiva bloqueadores de anuncios/VPN o prueba con otro navegador e inténtalo de nuevo."
      );
      return;
    }
    await saveProfile(updated);

    if (newEmail !== (profile!.email || "")) {
      const cur = window.prompt("Para cambiar tu correo, confirma tu contraseña actual:");
      if (cur === null) return;
      const curHash = await hashPassword(cur);
      const result = await setMyEmail(getSupabase(), profile!.id, curHash, newEmail);
      if (result === "ok") {
        await saveProfile({ ...updated, email: newEmail || null });
      } else if (result === "wrong_password") {
        setError("Contraseña incorrecta: el correo no se cambió (el apodo sí).");
        return;
      } else if (result === "taken") {
        setError("Ese correo ya está en uso por otra cuenta.");
        return;
      } else if (result === "invalid") {
        setError("El correo no es válido.");
        return;
      }
    }
    setErrorOk(true);
    setError("Cambios guardados.");
  }

  async function submitChangePassword() {
    setPassOk(false);
    if (!curPass) {
      setPassMsg("Escribe tu contraseña actual.");
      return;
    }
    if (!isPasswordMediumStrength(newPass)) {
      setPassMsg("La nueva contraseña debe tener mínimo 6 caracteres, con letras y números.");
      return;
    }
    if (newPass !== newPass2) {
      setPassMsg("Las contraseñas nuevas no coinciden.");
      return;
    }
    const curHash = await hashPassword(curPass);
    const newHash = await hashPassword(newPass);
    const ok = await changeMyPassword(getSupabase(), profile!.id, curHash, newHash);
    if (!ok) {
      setPassMsg("Tu contraseña actual no es correcta.");
      return;
    }
    await saveProfile({ ...profile!, passwordHash: newHash });
    setCurPass("");
    setNewPass("");
    setNewPass2("");
    setPassOk(true);
    setPassMsg("✅ Contraseña actualizada. Ya puedes usarla la próxima vez que inicies sesión.");
  }

  return (
    <section id="config">
      <div className="bp-form" style={{ display: "block", maxWidth: 480, margin: "0 auto" }}>
        <div className="auth-label">APODO</div>
        <input className="auth-input" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={16} />
        <div className="auth-label">
          NÚMERO <span className="auth-note-inline">· Tu dorsal (1 al 99), se ve en el torneo</span>
        </div>
        <input
          className="auth-input"
          type="number"
          min={1}
          max={99}
          inputMode="numeric"
          value={dorsal}
          onChange={(e) => setDorsal(e.target.value)}
          placeholder="Ej: 10"
        />
        <div className="auth-label">
          CORREO ELECTRÓNICO <span className="auth-note-inline">· Para recuperar tu contraseña</span>
        </div>
        <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={80} placeholder="tucorreo@gmail.com" />
        <div className="auth-label">EQUIPO</div>
        <input className="auth-input" value={profile.team || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} readOnly />
        <div className="auth-photo-note">
          Tu equipo se gestiona desde <a href="/equipos">EQUIPOS</a>, no se puede editar aquí.
        </div>
        <div className="auth-error" style={{ color: errorOk ? "var(--g)" : undefined }}>
          {error}
        </div>
        <button className="auth-submit" onClick={submitConfig}>
          GUARDAR CAMBIOS
        </button>
        <button
          className="auth-cancel"
          style={{ marginTop: 10 }}
          onClick={() => {
            logout();
            router.push("/");
          }}
        >
          CERRAR SESIÓN
        </button>
      </div>

      <div className="bp-form" style={{ display: "block", maxWidth: 480, margin: "24px auto 0" }}>
        <div className="page-banner-eyebrow" style={{ marginBottom: 14 }}>
          CAMBIAR CONTRASEÑA
        </div>
        <div className="auth-label">CONTRASEÑA ACTUAL</div>
        <input
          className="auth-input"
          type="password"
          value={curPass}
          onChange={(e) => setCurPass(e.target.value)}
          placeholder="Tu contraseña de ahora"
          maxLength={40}
        />
        <div className="auth-label">NUEVA CONTRASEÑA</div>
        <input
          className="auth-input"
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          placeholder="Mín. 6 caracteres, con letras y números"
          maxLength={40}
        />
        <div className="auth-label">CONFIRMAR NUEVA CONTRASEÑA</div>
        <input
          className="auth-input"
          type="password"
          value={newPass2}
          onChange={(e) => setNewPass2(e.target.value)}
          placeholder="Repite la nueva contraseña"
          maxLength={40}
        />
        <div className="auth-error" style={{ color: passOk ? "var(--g)" : undefined }}>
          {passMsg}
        </div>
        <button className="auth-submit" onClick={submitChangePassword}>
          ACTUALIZAR CONTRASEÑA
        </button>
      </div>
    </section>
  );
}
