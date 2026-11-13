"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import type { Gender, Position } from "@/types/profile";

type Tab = "new" | "existing" | "reset";

export function AuthModal() {
  const { isOpen, initialTab, closeAuth } = useAuthModal();
  const { login, register, requestReset, confirmReset } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [tab, setTab] = useState<Tab>(initialTab);
  // Reinicia la pestaña activa cada vez que el modal pasa de cerrado a abierto,
  // ajustando el estado durante el render en vez de con un efecto (evita el
  // "flash" de un render con la pestaña vieja antes de que el efecto corrija).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setTab(initialTab);
  }

  // ---- Crear cuenta ----
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<Gender>(null);
  const [position, setPosition] = useState<Position>("DEL");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [consent, setConsent] = useState(false);
  const [newError, setNewError] = useState("");
  const [newBusy, setNewBusy] = useState(false);

  // ---- Iniciar sesión ----
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  // ---- Recuperar contraseña ----
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  if (!isOpen) return null;

  function afterAuthSuccess() {
    closeAuth();
    if (pathname === "/") router.push("/dashboard");
  }

  async function handleLogin() {
    setLoginError("");
    setLoginBusy(true);
    const res = await login(loginId, loginPassword);
    setLoginBusy(false);
    if (!res.ok) {
      setLoginError(res.error || "No pudimos iniciar sesión.");
      return;
    }
    setLoginId("");
    setLoginPassword("");
    afterAuthSuccess();
  }

  async function handleRegister() {
    setNewError("");
    setNewBusy(true);
    const res = await register({ name, nickname, email, gender, position, password, passwordConfirm, consent });
    setNewBusy(false);
    if (!res.ok) {
      setNewError(res.error || "No pudimos crear la cuenta.");
      return;
    }
    afterAuthSuccess();
  }

  async function handleRequestReset() {
    setResetError("");
    setResetBusy(true);
    const res = await requestReset(resetEmail);
    setResetBusy(false);
    if (!res.ok) {
      setResetError(res.error || "No se pudo enviar el código.");
      return;
    }
    setResetSent(true);
    setResetSuccess("Si ese correo tiene una cuenta, te enviamos un código. Revisa tu bandeja y spam.");
  }

  async function handleConfirmReset() {
    setResetError("");
    setResetBusy(true);
    const res = await confirmReset(resetEmail, resetCode, resetPassword, resetPasswordConfirm);
    setResetBusy(false);
    if (!res.ok) {
      setResetError(res.error || "No se pudo procesar.");
      return;
    }
    setTab("existing");
    setResetSent(false);
    setResetCode("");
    setResetPassword("");
    setResetPasswordConfirm("");
    setResetSuccess("");
    alert("✅ Tu contraseña fue actualizada. Ya puedes iniciar sesión con tu nueva contraseña.");
  }

  return (
    <div className="modal-overlay open" id="auth-modal">
      <div className="auth-card">
        {tab !== "reset" && (
          <div className="auth-tabs">
            <div id="tab-new" className={`auth-tab${tab === "new" ? " on" : ""}`} onClick={() => setTab("new")}>
              CREAR CUENTA
            </div>
            <div id="tab-existing" className={`auth-tab${tab === "existing" ? " on" : ""}`} onClick={() => setTab("existing")}>
              INICIAR SESIÓN
            </div>
          </div>
        )}

        {tab === "new" && (
          <div id="auth-new">
            <div className="auth-photo-note">
              📷 Tu foto de jugador no se sube aquí: el equipo de LEVEL UP te la toma en tu primer partido en la
              cancha y la sube a tu carta.
            </div>
            <div className="auth-label">NOMBRE</div>
            <input id="auth-name" className="auth-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Santi Munez" maxLength={24} />
            <div className="auth-label">APODO</div>
            <input id="auth-nickname" className="auth-input" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ej: Santim" maxLength={16} />
            <div className="auth-label">CORREO ELECTRÓNICO</div>
            <input id="auth-email" className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ej: tucorreo.com" maxLength={80} />
            <div className="auth-label">
              GÉNERO <span className="auth-note-inline">· Opcional</span>
            </div>
            <select id="auth-gender" className="auth-input" value={gender ?? ""} onChange={(e) => setGender((e.target.value || null) as Gender)}>
              <option value="">Prefiero no decir</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
            </select>
            <div className="auth-label">POSICIÓN</div>
            <select id="auth-position" className="auth-input" value={position} onChange={(e) => setPosition(e.target.value as Position)}>
              <option value="DEL">DEL — Delantero</option>
              <option value="MED">MED — Mediocampista</option>
              <option value="DEF">DEF — Defensa</option>
              <option value="POR">POR — Portero</option>
            </select>
            <div className="auth-label">CONTRASEÑA</div>
            <input
              id="auth-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mín. 6 caracteres, con letras y números"
              maxLength={40}
            />
            <div className="auth-label">CONFIRMAR CONTRASEÑA</div>
            <input
              id="auth-password-confirm"
              className="auth-input"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              maxLength={40}
            />
            <label className="auth-consent">
              <input id="auth-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                He leído y acepto la{" "}
                <a href="/privacidad" target="_blank" rel="noreferrer">
                  Política de Tratamiento de Datos Personales y de Imagen
                </a>{" "}
                de LEVEL UP.
              </span>
            </label>
            <div id="auth-error" className="auth-error" dangerouslySetInnerHTML={{ __html: newError }} />
            <button className="auth-submit" disabled={newBusy} onClick={handleRegister}>
              {newBusy ? "CREANDO..." : "CREAR MI CARTA"}
            </button>
          </div>
        )}

        {tab === "existing" && (
          <div id="auth-existing">
            <div className="auth-label">NOMBRE O APODO</div>
            <input
              id="login-id"
              className="auth-input"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="Ej: Santi Munez o Santim"
              maxLength={24}
            />
            <div className="auth-label">CONTRASEÑA</div>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Tu contraseña"
              maxLength={40}
            />
            <div id="login-error" className="auth-error" dangerouslySetInnerHTML={{ __html: loginError }} />
            <button id="login-submit" className="auth-submit" disabled={loginBusy} onClick={handleLogin}>
              {loginBusy ? "VERIFICANDO..." : "INICIAR SESIÓN"}
            </button>
            <div className="auth-forgot">
              <a href="javascript:void(0)" onClick={() => setTab("reset")}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>
        )}

        {tab === "reset" && (
          <div id="auth-reset">
            <div className="auth-label">CORREO ELECTRÓNICO</div>
            <input
              id="reset-email"
              className="auth-input"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="El correo de tu cuenta"
              maxLength={80}
            />
            <button id="reset-send" className="auth-submit" disabled={resetBusy} onClick={handleRequestReset}>
              {resetBusy ? "ENVIANDO..." : resetSent ? "REENVIAR CÓDIGO" : "ENVIARME EL CÓDIGO"}
            </button>
            {resetSent && (
              <div id="reset-code-wrap">
                <div className="auth-label">CÓDIGO DE 6 DÍGITOS</div>
                <input
                  id="reset-code"
                  className="auth-input"
                  inputMode="numeric"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Revisa tu correo (y spam)"
                  maxLength={6}
                />
                <div className="auth-label">NUEVA CONTRASEÑA</div>
                <input
                  id="reset-password"
                  className="auth-input"
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres, con letras y números"
                  maxLength={40}
                />
                <div className="auth-label">CONFIRMAR NUEVA CONTRASEÑA</div>
                <input
                  id="reset-password-confirm"
                  className="auth-input"
                  type="password"
                  value={resetPasswordConfirm}
                  onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  placeholder="Repite tu nueva contraseña"
                  maxLength={40}
                />
                <button id="reset-submit" className="auth-submit" disabled={resetBusy} onClick={handleConfirmReset}>
                  CAMBIAR CONTRASEÑA
                </button>
              </div>
            )}
            <div id="reset-error" className="auth-error" style={{ color: resetSuccess ? "var(--g)" : undefined }}>
              {resetError || resetSuccess}
            </div>
            <div className="auth-forgot">
              <a href="javascript:void(0)" onClick={() => { setTab("existing"); setResetSent(false); setResetError(""); setResetSuccess(""); }}>
                Volver a iniciar sesión
              </a>
            </div>
          </div>
        )}

        <button id="auth-cancel" className="auth-cancel" onClick={closeAuth}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
