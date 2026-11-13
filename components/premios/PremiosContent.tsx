"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfiles } from "@/context/ProfilesContext";
import { getSupabase } from "@/lib/supabase/client";
import { toCoins } from "@/lib/domain/wallet";
import { redeemPrize } from "@/lib/domain/prizes";
import { submitFeedback } from "@/lib/domain/feedback";

const FEATURED_PRIZE = { name: "Uniforme oficial LEVEL UP", cost: 140 };

const OTHER_PRIZES = [
  { icon: "🧢", name: "Gorra LEVEL UP", cost: 40 },
  { icon: "⚽", name: "Balón oficial", cost: 55 },
  { icon: "🥤", name: "Termo LEVEL UP", cost: 25 },
  { icon: "🎽", name: "Uniforme oficial", cost: 140 },
];

interface Spark {
  left: string;
  bottom: string;
  delay: string;
  duration: string;
  even: boolean;
}

export function PremiosContent() {
  const { profile: me, saveProfile } = useAuth();
  const { setProfile } = useProfiles();
  const [msg, setMsg] = useState<{ text: string; color: "" | "err" | "ok" } | null>(null);
  const [busy, setBusy] = useState(false);
  // Generado una sola vez al montar (Math.random() no es puro para useMemo).
  const [sparks] = useState<Spark[]>(() =>
    Array.from({ length: 14 }, (_, i) => ({
      left: `${10 + Math.random() * 80}%`,
      bottom: `${20 + Math.random() * 40}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3.5 + Math.random() * 3}s`,
      even: i % 2 === 0,
    }))
  );

  async function canjear(nombre: string, costo: number) {
    if (!me) return;
    const misCoins = toCoins(me.saldo);
    if (misCoins < costo) {
      setMsg({ text: `No tienes suficientes Level Coins (${misCoins} / ${costo}). Recárgalos o gánalos jugando.`, color: "err" });
      return;
    }
    if (!confirm(`¿Canjear "${nombre}" por ${costo} Level Coins?`)) return;
    setMsg({ text: "Canjeando...", color: "" });
    setBusy(true);
    try {
      const sb = getSupabase();
      const res = await redeemPrize(sb, me.id, costo, nombre);
      if (!res.ok) {
        setMsg({ text: res.error || "No se pudo canjear. Intenta de nuevo.", color: "err" });
        return;
      }
      const updated = {
        ...me,
        saldo: Math.max(0, (me.saldo || 0) - costo * 1300),
        notifications: [...me.notifications, { icon: "🎁", text: `¡Canjeaste ${nombre}! El equipo de LEVEL UP te lo entregará en tu próximo partido competitivo.`, time: "AHORA" }],
      };
      setProfile(updated);
      await saveProfile(updated);
      try {
        await submitFeedback(sb, {
          type: "canje",
          message: `CANJE DE PREMIO: ${nombre} (${costo} coins) — entregar en su proximo partido competitivo`,
          reporterId: me.id,
          reporterName: me.nickname || me.name,
          contact: me.email || null,
          page: "/premios",
        });
      } catch {
        /* el canje ya quedó registrado; el ticket de aviso es secundario */
      }
      setMsg({ text: `✅ ¡Canjeado! El equipo de LEVEL UP te entregará tu ${nombre} en tu próximo partido competitivo.`, color: "ok" });
    } catch {
      setMsg({ text: "Error de conexión. Intenta de nuevo.", color: "err" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pz-wrap">
      <div className="pz-head">
        <div className="pz-eyebrow">RECOMPENSAS LEVEL UP</div>
        <h1>
          GANA. CANJEA. <span>PRESUME.</span>
        </h1>
        <p>Junta Level Coins jugando o recargando, y llévate premios reales.</p>
      </div>

      <div className="stage">
        <div className="spotlight"></div>
        <div className="sparkles" id="sparkles">
          {sparks.map((s, i) => (
            <div
              className="sp"
              key={i}
              style={{
                left: s.left,
                bottom: s.bottom,
                animationDelay: s.delay,
                animationDuration: s.duration,
                background: s.even ? "#22d3ee" : "#ff2fb0",
                boxShadow: s.even ? "0 0 8px #22d3ee" : "0 0 8px #ff2fb0",
              }}
            />
          ))}
        </div>
        <div className="prize-badge">👑 PREMIO ESTRELLA · TEMPORADA 1</div>

        <div className="podium">
          <div className="floater">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="kit" id="pz-kit" src="/assets/premio-kit-front.png" alt="Uniforme oficial LEVEL UP" />
          </div>
          <div className="reflection"></div>
        </div>

        <div className="prize-name">UNIFORME OFICIAL LEVEL UP</div>
        <div className="prize-sub">Camiseta + pantaloneta · edición Temporada 1 · diseñado para ganadores</div>

        <button
          className="price-tag"
          id="pz-redeem"
          disabled={busy}
          style={{ cursor: "pointer", border: "1px solid rgba(201,168,76,.4)" }}
          onClick={() => canjear(FEATURED_PRIZE.name, FEATURED_PRIZE.cost)}
        >
          <svg className="coin" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="#1a1205" stroke="url(#cg)" strokeWidth="2.4" />
            <text x="20" y="26" textAnchor="middle" fontFamily="Orbitron" fontWeight="900" fontSize="14" fill="url(#cg)">
              LC
            </text>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#c9a84c" />
                <stop offset="1" stopColor="#00ff88" />
              </linearGradient>
            </defs>
          </svg>
          <span className="n">{FEATURED_PRIZE.cost}</span>
          <span className="eq">Level Coins · CANJEAR</span>
        </button>
        {msg && (
          <div id="pz-msg" style={{ position: "relative", zIndex: 3, marginTop: 14, fontFamily: "var(--ft)", fontSize: 11, letterSpacing: 1, minHeight: 16, color: msg.color === "err" ? "#ff5a5a" : msg.color === "ok" ? "var(--g)" : undefined }}>
            {msg.text}
          </div>
        )}
      </div>

      <div className="cat-title">TODOS LOS PREMIOS</div>
      <div className="pz-grid">
        {OTHER_PRIZES.map((p) => (
          <div className="rw" key={p.name}>
            <div className="thumb">{p.icon}</div>
            <div className="rn">{p.name}</div>
            <div className="rp">🪙 {p.cost} coins</div>
            <div className="rb">PRONTO</div>
          </div>
        ))}
      </div>
    </div>
  );
}
