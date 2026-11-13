"use client";

import { useState } from "react";
import { useHasMounted } from "@/hooks/useHasMounted";

interface Spark {
  left: string;
  bottom: string;
  delay: string;
  duration: string;
  alt: boolean;
}

const CATALOG = [
  { thumb: "🧢", name: "Gorra LEVEL UP", price: "🪙 40 coins", cta: "CANJEAR", locked: false },
  { thumb: "⚽", name: "Balón oficial", price: "🪙 55 coins", cta: "CANJEAR", locked: false },
  { thumb: "🥤", name: "Termo LEVEL UP", price: "🪙 25 coins", cta: "CANJEAR", locked: false },
  { thumb: "🎽", name: "Uniforme oficial", price: "🪙 140 coins", cta: "TE FALTAN 34", locked: true },
  { thumb: "🏆", name: "Cupo torneo VIP", price: "🪙 50 coins", cta: "CANJEAR", locked: true },
  { thumb: "👟", name: "Guayos edición", price: "🪙 200 coins", cta: "PRÓXIMAMENTE", locked: true },
];

/**
 * Puerto fiel de premios-preview.html — mockup del catálogo de premios con
 * el uniforme oficial como pieza destacada (turntable de doble cara). Sin
 * conexión real: los botones muestran el mismo alert() informativo que el
 * original, no tocan Supabase.
 */
export function PremiosPreviewContent() {
  // Generado una sola vez al montar (Math.random() no es puro para useMemo).
  const [sparks] = useState<Spark[]>(() =>
    Array.from({ length: 14 }, (_, i) => ({
      left: `${10 + Math.random() * 80}%`,
      bottom: `${20 + Math.random() * 40}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3.5 + Math.random() * 3}s`,
      alt: i % 2 === 0,
    }))
  );
  // Esta página se pre-renderiza estática (export) sin AuthGuard, así que el
  // valor aleatorio SÍ se computa en esa pasada — hay que esperar a montar en
  // el cliente antes de pintar posiciones distintas, o React marca un
  // mismatch de hidratación.
  const hasMounted = useHasMounted();

  return (
    <div className="pz-preview-page">
      <div className="pv">◆ PREVIEW · Página de PREMIOS · el uniforme es de muestra (luego ponemos el tuyo real)</div>
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">RECOMPENSAS LEVEL UP</div>
          <h1>
            GANA. CANJEA. <span>PRESUME.</span>
          </h1>
          <p>Junta Level Coins jugando o recargando, y llévate premios reales.</p>
        </div>

        <div className="stage">
          <div className="spotlight"></div>
          <div className="sparkles">
            {hasMounted &&
              sparks.map((s, i) => (
                <div className={`sp${s.alt ? " alt" : ""}`} key={i} style={{ left: s.left, bottom: s.bottom, animationDelay: s.delay, animationDuration: s.duration }} />
              ))}
          </div>

          <div className="prize-badge">👑 PREMIO ESTRELLA · TEMPORADA 1</div>

          <div className="podium">
            <div className="floater">
              <div className="spinner">
                <div className="face front">
                  <svg className="jersey" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="jg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#0d1524" />
                        <stop offset="1" stopColor="#04060b" />
                      </linearGradient>
                      <linearGradient id="stripe" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#22d3ee" />
                        <stop offset="1" stopColor="#ff2fb0" />
                      </linearGradient>
                    </defs>
                    <path d="M66 20 L100 38 L134 20 L176 50 L160 96 L142 84 L142 168 L58 168 L58 84 L40 96 L24 50 Z" fill="url(#jg)" stroke="#1b2740" strokeWidth="1.4" />
                    <path d="M84 34 L100 52 L116 34 L110 34 L100 45 L90 34 Z" fill="url(#stripe)" />
                    <path d="M58 120 L110 168 L96 168 L58 134 Z" fill="#ff2fb0" opacity=".55" />
                    <path d="M58 100 L142 168 L120 168 L58 118 Z" fill="#22d3ee" opacity=".35" />
                    <path d="M120 60 L140 96 L132 96 L114 62 Z" fill="#22d3ee" opacity=".5" />
                    <path d="M128 70 L150 60 L140 96 Z" fill="#ff2fb0" opacity=".4" />
                    <path d="M176 50 L160 96 L152 92 L168 50 Z" fill="#ff2fb0" opacity=".7" />
                    <path d="M24 50 L40 96 L48 92 L32 50 Z" fill="#22d3ee" opacity=".7" />
                    <path d="M112 66 l5 9 l5 -12 l5 12 l5 -9 l-1.5 15 l-17 0 Z" fill="url(#stripe)" />
                    <path d="M62 174 L138 174 L134 232 L104 232 L100 196 L96 232 L66 232 Z" fill="url(#jg)" stroke="#1b2740" strokeWidth="1.2" />
                    <path d="M120 178 L128 178 L126 232 L120 232 Z" fill="url(#stripe)" opacity=".8" />
                    <path d="M72 178 l6 0 l1 12 l-8 0 Z" fill="url(#stripe)" opacity=".8" />
                  </svg>
                </div>
                <div className="face back">
                  <svg className="jersey" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
                    <path d="M66 20 L100 38 L134 20 L176 50 L160 96 L142 84 L142 168 L58 168 L58 84 L40 96 L24 50 Z" fill="url(#jg)" stroke="#1b2740" strokeWidth="1.4" />
                    <path d="M92 40 L108 40 L106 168 L94 168 Z" fill="url(#stripe)" opacity=".85" />
                    <path d="M96 40 L104 40 L103 168 L97 168 Z" fill="#04060b" />
                    <path d="M96 40 L104 40 L103 168 L97 168 Z" fill="url(#stripe)" opacity=".5" />
                    <path d="M92 50 l4 7 l4 -9 l4 9 l4 -7 l-1 12 l-14 0 Z" fill="#22d3ee" />
                    <path d="M176 50 L160 96 L152 92 L168 50 Z" fill="#22d3ee" opacity=".7" />
                    <path d="M24 50 L40 96 L48 92 L32 50 Z" fill="#ff2fb0" opacity=".7" />
                    <path d="M62 174 L138 174 L134 232 L104 232 L100 196 L96 232 L66 232 Z" fill="url(#jg)" stroke="#1b2740" strokeWidth="1.2" />
                    <path d="M96 178 L104 178 L103 232 L97 232 Z" fill="url(#stripe)" opacity=".8" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="ring"></div>
            <div className="reflection"></div>
          </div>

          <div className="prize-name">UNIFORME OFICIAL LEVEL UP</div>
          <div className="prize-sub">Camiseta + pantaloneta · edición Temporada 1 · diseñado para ganadores</div>

          <div className="price-tag">
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
            <span className="n">140</span>
            <span className="eq">coins · ≈ $182.000</span>
          </div>

          <div className="cta-row">
            <button className="cta redeem" onClick={() => alert("Canjear → descuenta 140 coins y te llega un ticket para entregarte el uniforme")}>
              CANJEAR AHORA
            </button>
            <button className="cta win" onClick={() => alert("Cómo ganarlo → gánalo jugando y llévate el premio, o canjéalo con tus coins")}>
              CÓMO GANARLO
            </button>
          </div>

          <div className="progress">
            <div className="pl">
              <span>Tu progreso</span>
              <span>
                <b>106</b> / 140 coins
              </span>
            </div>
            <div className="track">
              <div className="fill"></div>
            </div>
          </div>
        </div>

        <div className="cat-title">TODOS LOS PREMIOS</div>
        <div className="grid">
          {CATALOG.map((p) => (
            <div className={`rw${p.locked ? " locked" : ""}`} key={p.name}>
              <div className="thumb">{p.thumb}</div>
              <div className="rn">{p.name}</div>
              <div className="rp">{p.price}</div>
              <div className="rb">{p.cta}</div>
            </div>
          ))}
        </div>

        <div className="adminbox">
          <h4>◆ Cómo cargarás los premios (solo tú, admin)</h4>
          <p>Igual que los torneos: un botón &quot;+ AGREGAR PREMIO&quot; donde subes foto, nombre y precio en coins. Aparece al instante para todos. Puedes marcarlo &quot;disponible&quot;, &quot;agotado&quot; o &quot;próximamente&quot;.</p>
        </div>
      </div>
    </div>
  );
}
