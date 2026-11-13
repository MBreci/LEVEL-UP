"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getSupabase } from "@/lib/supabase/client";
import { createLocalStore } from "@/lib/localStore";
import {
  FEEDBACK_STATUS_LABEL,
  FEEDBACK_TYPE_ICON,
  adminListFeedback,
  adminReplyFeedback,
  fetchMyTickets,
  submitFeedback,
  type FeedbackTicket,
  type FeedbackType,
} from "@/lib/domain/feedback";

const seenStore = createLocalStore<Record<string, string>>("levelup_fb_seen", {});

const FB_TYPES: [FeedbackType, string][] = [
  ["bug", "🐛 Bug"],
  ["idea", "💡 Idea"],
  ["comentario", "💬 Comentario"],
];

type ModalId = "none" | "main" | "mine" | "admin";

export function FeedbackWidget() {
  const { profile, isAdmin } = useAuth();
  const pathname = usePathname();
  const [modal, setModal] = useState<ModalId>("none");
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const timer = setTimeout(async () => {
      const tickets = await fetchMyTickets(getSupabase(), profile.id);
      const seen = seenStore.getSnapshot();
      const n = tickets.filter((t) => t.admin_reply && t.replied_at && seen[t.id] !== t.replied_at).length;
      setUnread(n);
    }, 1500);
    return () => clearTimeout(timer);
  }, [profile]);

  // La consola en vivo del partido (Fase 5) tiene su propio CSS aislado; el widget
  // ahí sale sin estilo y estorba. No se muestra en esa pantalla.
  if (pathname?.startsWith("/admin/partido")) return null;

  function openMain() {
    setType("bug");
    setMessage("");
    setStatus(null);
    setContact((prev) => prev || profile?.email || "");
    setModal("main");
  }

  async function submit() {
    if (message.trim().length < 3) {
      setStatus({ text: "Escribe un poco más para poder ayudarte.", ok: false });
      return;
    }
    setStatus(null);
    setSending(true);
    try {
      await submitFeedback(getSupabase(), {
        type,
        message: message.trim(),
        reporterId: profile?.id ?? null,
        reporterName: profile ? profile.nickname || profile.name : null,
        contact: contact.trim().toLowerCase() || profile?.email || null,
        page: pathname || "/",
      });
      setStatus({ text: "¡Gracias! Recibimos tu mensaje. 🙌", ok: true });
      setMessage("");
      setTimeout(() => setModal("none"), 1200);
    } catch {
      setStatus({ text: "No se pudo enviar. Inténtalo de nuevo.", ok: false });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button id="fb-fab" className="fb-fab" onClick={openMain} title="Reportar un problema o dar tu opinión">
        💬
        {unread > 0 && (
          <span id="fb-fab-badge" className="fb-fab-badge">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {isAdmin && (
        <button id="fb-admin-fab" className="fb-fab fb-admin" onClick={() => setModal("admin")} title="Tickets (admin)">
          🎫
        </button>
      )}

      <div className={`modal-overlay ${modal === "main" ? "open" : ""}`} id="fb-modal">
        <div className="auth-card" style={{ maxWidth: 440 }}>
          <div className="auth-label" style={{ fontSize: 16, color: "var(--g)" }}>
            CUÉNTANOS
          </div>
          <div className="auth-photo-note">¿Encontraste un error o tienes una idea? Escríbenos, lo revisamos.</div>
          <div className="auth-label">TIPO</div>
          <div className="fb-types" id="fb-types">
            {FB_TYPES.map(([v, l]) => (
              <button type="button" key={v} className={`fb-type ${type === v ? "on" : ""}`} onClick={() => setType(v)}>
                {l}
              </button>
            ))}
          </div>
          <div className="auth-label">TU MENSAJE</div>
          <textarea
            className="auth-input"
            id="fb-message"
            maxLength={1000}
            rows={4}
            style={{ resize: "vertical" }}
            placeholder="Cuéntanos qué pasó o qué se te ocurre..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="auth-label">
            TU CORREO <span className="auth-note-inline">· Opcional, por si queremos responderte</span>
          </div>
          <input
            className="auth-input"
            id="fb-contact"
            type="email"
            maxLength={80}
            placeholder="tucorreo@gmail.com"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <div className="auth-error" id="fb-msg" style={status?.ok ? { color: "var(--g)" } : undefined}>
            {status?.text}
          </div>
          <button className="auth-submit" id="fb-send" disabled={sending} onClick={submit}>
            {sending ? "ENVIANDO..." : "ENVIAR"}
          </button>
          {profile && (
            <button className="auth-cancel" id="fb-mine-btn" onClick={() => setModal("mine")}>
              VER MIS MENSAJES
            </button>
          )}
          <button className="auth-cancel" onClick={() => setModal("none")}>
            CANCELAR
          </button>
        </div>
      </div>

      {modal === "mine" && <MyTicketsModal onUnreadCleared={() => setUnread(0)} onClose={() => setModal("none")} />}
      {modal === "admin" && <AdminTicketsModal onClose={() => setModal("none")} />}
    </>
  );
}

function MyTicketsModal({ onClose, onUnreadCleared }: { onClose: () => void; onUnreadCleared: () => void }) {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<FeedbackTicket[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    (async () => {
      const data = await fetchMyTickets(getSupabase(), profile.id);
      if (cancelled) return;
      setTickets(data);
      const seen = { ...seenStore.getSnapshot() };
      data.forEach((t) => {
        if (t.admin_reply && t.replied_at) seen[t.id] = t.replied_at;
      });
      seenStore.set(seen);
      onUnreadCleared();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  return (
    <div className="modal-overlay open" id="fb-mine-modal">
      <div className="auth-card" style={{ maxWidth: 520, maxHeight: "85vh", overflowY: "auto" }}>
        <div className="auth-label" style={{ fontSize: 16, color: "var(--g)" }}>
          📨 MIS MENSAJES
        </div>
        <div className="auth-photo-note">Aquí ves tus mensajes y la respuesta del equipo LEVEL UP.</div>
        <div id="fb-mine-list">
          {tickets === null ? (
            <div className="auth-photo-note">Cargando...</div>
          ) : !tickets.length ? (
            <div className="auth-photo-note">Aún no has enviado mensajes.</div>
          ) : (
            tickets.map((t) => (
              <div className={`fb-ticket ${t.status}`} key={t.id}>
                <div className="fb-ticket-top">
                  <span className="fb-ticket-type">
                    {FEEDBACK_TYPE_ICON[t.type] || "💬"} {(t.type || "").toUpperCase()}
                  </span>
                  <span className={`fb-ticket-status fb-st-${t.status}`}>{FEEDBACK_STATUS_LABEL[t.status] || (t.status || "").toUpperCase()}</span>
                </div>
                <div className="fb-ticket-msg">{t.message}</div>
                {t.admin_reply ? (
                  <div className="fb-ticket-reply">
                    <b style={{ color: "var(--g)" }}>LEVEL UP:</b> {t.admin_reply}
                  </div>
                ) : (
                  <div className="fb-ticket-meta">Aún sin respuesta. Te avisaremos aquí cuando te respondamos. 🙌</div>
                )}
              </div>
            ))
          )}
        </div>
        <button className="auth-cancel" onClick={onClose}>
          CERRAR
        </button>
      </div>
    </div>
  );
}

function AdminTicketsModal({ onClose }: { onClose: () => void }) {
  const { profile, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<FeedbackTicket[] | null>(null);
  const [replies, setReplies] = useState<Record<number, string>>({});

  async function load() {
    if (!profile || !isAdmin) return;
    const data = await adminListFeedback(getSupabase(), profile.id);
    setTickets(data);
  }

  useEffect(() => {
    if (!profile || !isAdmin) return;
    (async () => {
      const data = await adminListFeedback(getSupabase(), profile.id);
      setTickets(data);
    })();
  }, [profile, isAdmin]);

  async function reply(id: number) {
    if (!profile) return;
    const text = (replies[id] || "").trim();
    if (!text) {
      alert("Escribe una respuesta.");
      return;
    }
    const ok = await adminReplyFeedback(getSupabase(), profile.id, id, text, "revisado");
    if (ok) load();
    else alert("No se pudo enviar la respuesta.");
  }

  async function markResolved(id: number) {
    if (!profile) return;
    const ok = await adminReplyFeedback(getSupabase(), profile.id, id, null, "resuelto");
    if (ok) load();
    else alert("No se pudo enviar la respuesta.");
  }

  return (
    <div className="modal-overlay open" id="fb-admin-modal">
      <div className="auth-card" style={{ maxWidth: 600, maxHeight: "85vh", overflowY: "auto" }}>
        <div className="auth-label" style={{ fontSize: 16, color: "var(--g)" }}>
          🎫 TICKETS DE JUGADORES
        </div>
        <div id="fb-admin-list">
          {tickets === null ? (
            <div className="auth-photo-note">Cargando...</div>
          ) : !tickets.length ? (
            <div className="auth-photo-note">Aún no hay tickets. 🎉</div>
          ) : (
            tickets.map((t) => (
              <div className={`fb-ticket ${t.status}`} key={t.id}>
                <div className="fb-ticket-top">
                  <span className="fb-ticket-type">
                    {FEEDBACK_TYPE_ICON[t.type] || "💬"} {t.type.toUpperCase()}
                  </span>
                  <span className={`fb-ticket-status fb-st-${t.status}`}>{t.status.toUpperCase()}</span>
                </div>
                <div className="fb-ticket-msg">{t.message}</div>
                <div className="fb-ticket-meta">
                  De: <b>{t.reporter_name || "Anónimo"}</b>
                  {t.contact_email ? " · " + t.contact_email : ""} · {t.page || ""}
                </div>
                {t.admin_reply && <div className="fb-ticket-reply">Admin: {t.admin_reply}</div>}
                <textarea
                  className="auth-input fb-reply-box"
                  rows={2}
                  placeholder="Responder como Admin..."
                  value={replies[t.id] || ""}
                  onChange={(e) => setReplies((prev) => ({ ...prev, [t.id]: e.target.value }))}
                />
                <div className="fb-ticket-actions">
                  <button className="notif-accept" onClick={() => reply(t.id)}>
                    RESPONDER
                  </button>
                  <button className="mm-admin-btn" onClick={() => markResolved(t.id)}>
                    MARCAR RESUELTO
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <button className="auth-cancel" onClick={onClose}>
          CERRAR
        </button>
      </div>
    </div>
  );
}
