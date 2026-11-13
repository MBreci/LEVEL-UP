"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useMatches } from "@/context/MatchesContext";
import { getSupabase } from "@/lib/supabase/client";
import { getMatchMessages, postMatchMessage, type MatchMessage } from "@/lib/domain/chat";
import { matchParticipantIds } from "@/lib/domain/playerView";
import { censorProfanity } from "@/lib/domain/rank";

export function MatchChatModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const { profile: me } = useAuth();
  const { openMatches } = useMatches();
  const match = openMatches.find((m) => m.id === matchId);
  const isPart = !!me && !!match && matchParticipantIds(match).has(me.id);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!me || !isPart) return;
    let cancelled = false;
    async function refresh() {
      const msgs = await getMatchMessages(getSupabase(), matchId, me!.id);
      if (!cancelled) setMessages(msgs);
    }
    refresh();
    const timer = setInterval(refresh, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [matchId, me, isPart]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    if (!me) return;
    const text = censorProfanity(input.trim());
    if (!text) return;
    setInput("");
    const ok = await postMatchMessage(getSupabase(), matchId, me.id, me.nickname || me.name, text);
    if (ok) {
      setMessages(await getMatchMessages(getSupabase(), matchId, me.id));
    } else {
      setInput(text);
      alert("No se pudo enviar. Debes estar unido al partido para escribir.");
    }
  }

  return createPortal(
    <div className="modal-overlay open" id="mchat-modal">
      <div className="mchat-card">
        <div className="mchat-head">
          <div className="mchat-title">💬 CHAT DEL PARTIDO</div>
          <div className="mchat-sub">{match ? match.cancha || match.zona : ""}</div>
        </div>
        <div className="mchat-body" ref={bodyRef}>
          {!isPart ? (
            <div className="mchat-empty">Únete a este partido para ver y escribir en el chat con tu equipo.</div>
          ) : messages.length === 0 ? (
            <div className="mchat-empty">Aún no hay mensajes. ¡Rompe el hielo y coordina con tu equipo!</div>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === me?.id;
              const t = new Date(m.created_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
              return (
                <div className={`mchat-msg ${mine ? "mine" : ""}`} key={m.id}>
                  {!mine && <div className="mchat-name">{m.sender_name || "Jugador"}</div>}
                  <div className="mchat-bubble">{censorProfanity(m.text || "")}</div>
                  <div className="mchat-time">{t}</div>
                </div>
              );
            })
          )}
        </div>
        {isPart && (
          <div className="mchat-input-row">
            <input
              className="mchat-input"
              maxLength={500}
              placeholder="Escribe un mensaje..."
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button className="mchat-send" onClick={send}>
              ➤
            </button>
          </div>
        )}
        <button className="auth-cancel" style={{ margin: "0 16px 16px" }} onClick={onClose}>
          CERRAR
        </button>
      </div>
    </div>,
    document.body
  );
}
