"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface Particle {
  left: string;
  delay: string;
  duration: string;
}

export function WelcomeHero() {
  const { profile } = useAuth();
  const router = useRouter();
  // Generado en el inicializador de useState (corre una sola vez al montar), no en
  // useMemo: useMemo debe ser puro y Math.random() no lo es.
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 24 }, () => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 6}s`,
    }))
  );

  return (
    <div className="hw-hero" id="hw-hero">
      <div className="hw-hero-bg"></div>
      <div className="hw-hero-fog"></div>
      <div className="hw-hero-particles" id="hw-particles">
        {particles.map((p, i) => (
          <div className="hw-particle" key={i} style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration }} />
        ))}
      </div>
      <div className="hw-hero-content">
        <div className="page-banner-eyebrow">
          BIENVENIDO, <span id="hw-name">{(profile?.nickname || profile?.name || "JUGADOR").toUpperCase()}</span>
        </div>
        <div className="hw-hero-title">
          BIENVENIDO A
          <br />
          LEVEL UP
        </div>
        <div className="hw-hero-sub">
          Tu carrera como futbolista comienza aquí.
          <br />
          No vienes únicamente a jugar partidos. Vienes a construir una historia.
        </div>
        <div className="hw-hero-cta-row">
          <button className="hw-cta-main" onClick={() => router.push("/buscar-partido")}>
            COMENZAR MI CARRERA
          </button>
          <button
            className="hw-cta-sec"
            onClick={() => document.getElementById("hw-que-es")?.scrollIntoView({ behavior: "smooth" })}
          >
            DESCUBRIR LEVEL UP
          </button>
        </div>
      </div>
    </div>
  );
}
