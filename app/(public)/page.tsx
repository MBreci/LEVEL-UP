"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { HeroFloats, HeroStats } from "@/components/landing/HeroFloats";
import { GuestHeader } from "@/components/layout/GuestHeader";

export default function LandingPage() {
  const { profile } = useAuth();
  const { openAuth } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    if (profile) router.replace("/dashboard");
  }, [profile, router]);

  return (
    <>
      <GuestHeader showInicio />
      <section className="hero" id="inicio">
        <div className="hero-bg" id="hero-bg">
          <div className="hero-bg-img"></div>
          <div className="hero-bg-smoke"></div>
          <div className="hero-beams"></div>
          <div className="hero-bg-light"></div>
        </div>
        <div className="hero-glow-core"></div>
        <div className="hero-particles">
          <span className="hp hp1"></span>
          <span className="hp hp2"></span>
          <span className="hp hp3"></span>
          <span className="hp hp4"></span>
          <span className="hp hp5"></span>
          <span className="hp hp6"></span>
        </div>
        <div className="hero-frame">
          <span className="hf-corner tl"></span>
          <span className="hf-corner tr"></span>
          <span className="hf-corner bl"></span>
          <span className="hf-corner br"></span>
        </div>
        <HeroFloats />
        <div className="hero-content">
          <div className="h-season">TEMPORADA BETA &nbsp;·&nbsp; COLOMBIA &nbsp;·&nbsp; 2026</div>
          <div className="h-sub-label">LA NUEVA ERA DEL FÚTBOL AMATEUR</div>
          <div className="h-title">
            <span className="t1">JUEGA.</span>
            <span className="t2">COMPITE.</span>
            <span className="t3">ASCIENDE.</span>
          </div>
          <div className="h-desc">Transforma cada partido en una carrera deportiva digital.</div>
          <div className="h-btns">
            <button className="hb1 hb1-neon" onClick={() => openAuth(true)}>CREAR PERFIL</button>
            <button className="hb2" onClick={() => openAuth(false)}>INICIAR SESIÓN</button>
          </div>
          <HeroStats />
        </div>
      </section>

      <section className="ld-pain-section">
        <div className="ld-pain-wrap">
          <div className="ld-tagline">
            <span className="ld-tg-w">Encuentra jugadores,</span>
            <span className="ld-tg-p"> completa equipos</span>
            <span className="ld-tg-w"> y descubre una comunidad donde</span>
            <span className="ld-tg-g"> siempre hay alguien listo para jugar.</span>
          </div>
        </div>
      </section>

      <section className="sec-cine ld-imagine-section">
        <div className="sec-cine-bg"></div>
        <div className="sec-cine-scrim"></div>
        <div className="sec-cine-smoke"></div>
        <div className="sec-hdr" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px", position: "relative", zIndex: 2 }}>
          <div className="sec-eyebrow center"><span className="ar">▶</span> UNA IDEA <span className="ar">◀</span></div>
          <div className="sec-title" style={{ fontSize: "clamp(28px,4.5vw,52px)", lineHeight: 1.1 }}>Imagina un lugar donde</div>
        </div>
        <div className="ld-imagine-grid">
          <div className="ld-imagine-card g">
            <div className="ld-ic-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4.5 12.5H11l-1 9.5L20 11h-6.5L13 2Z"/></svg></div>
            <div className="ld-ic-text">Completas rápido tu equipo para asegurar tu partido.</div>
          </div>
          <div className="ld-imagine-card f">
            <div className="ld-ic-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg></div>
            <div className="ld-ic-text">Cada partido que juegas tiene importancia más allá del marcador.</div>
          </div>
          <div className="ld-imagine-card g">
            <div className="ld-ic-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6.5-5.7-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.3 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.4"/></svg></div>
            <div className="ld-ic-text">Conoces futbolistas cerca de ti que buscan exactamente lo mismo que tú.</div>
          </div>
          <div className="ld-imagine-card f">
            <div className="ld-ic-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9.5 10.5 13.5 14.5 21 7"/><polyline points="15 7 21 7 21 13"/></svg></div>
            <div className="ld-ic-text">Tu rendimiento queda registrado. Y mejora partido a partido.</div>
          </div>
          <div className="ld-imagine-card g">
            <div className="ld-ic-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M6.5 4h11v4.5a5.5 5.5 0 0 1-11 0V4Z"/><path d="M6.5 6H4v1.5A3 3 0 0 0 7 10.5M17.5 6H20v1.5a3 3 0 0 1-3 3"/></svg></div>
            <div className="ld-ic-text">Tu equipo construye una reputación. Y el barrio empieza a saberlo.</div>
          </div>
          <div className="ld-imagine-card f">
            <div className="ld-ic-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.5C10.5 5.2 8.5 4.5 4 4.5V18c4.5 0 6.5.7 8 2 1.5-1.3 3.5-2 8-2V4.5c-4.5 0-6.5.7-8 2Z"/><path d="M12 6.5V20"/></svg></div>
            <div className="ld-ic-text">Tienes una historia deportiva. Una que no desaparece al final del partido.</div>
          </div>
        </div>
        <div className="ld-imagine-cta" style={{ position: "relative", zIndex: 2 }}>
          <button className="ld-neon-btn" onClick={() => openAuth(true)}>QUIERO ENTRAR</button>
        </div>
      </section>

      <section className="ld-manifesto-section">
        <div className="ld-manifesto-glow"></div>
        <div className="ld-manifesto-wrap">
          <div className="ld-manifesto-body">
            <p className="ld-manifesto-big">
              <span className="ld-mf-g">LEVEL UP</span> nació como una iniciativa que propone{" "}
              <span className="ld-mf-f">cambiar la experiencia amateur del fútbol colombiano.</span>
            </p>
            <p>Conectamos jugadores, facilitamos la organización de partidos y le damos forma a algo que antes no existía en el fútbol de barrio:</p>
            <p className="ld-manifesto-highlight">una carrera deportiva real.</p>
          </div>
        </div>
      </section>

      <section id="preview-carta" className="ld-carta-section">
        <div className="ld-carta-glow"></div>
        <div className="sec-hdr" style={{ textAlign: "center", marginBottom: 0, position: "relative", zIndex: 2 }}>
          <div className="sec-eyebrow center"><span className="ar">▶</span> TU IDENTIDAD <span className="ar">◀</span></div>
          <div className="ld-carta-title">Tu identidad deportiva<br />todavía no existe.</div>
          <div className="ld-carta-subtitle">Pero puede empezar hoy.</div>
        </div>
        <div className="card-section" style={{ position: "relative", zIndex: 2 }}>
          <div className="ld-carta-blur-wrap">
            <div className="fifa rk-elite epic ld-carta-preview">
              <div className="fc-shine"></div>
              <div className="fc-sparks"></div>
              <span className="fc-corner tl"></span>
              <span className="fc-corner tr"></span>
              <span className="fc-corner bl"></span>
              <span className="fc-corner br"></span>
              <div className="fc-crest"><span className="fc-crest-orn">◆</span> LEVEL UP <span className="fc-crest-orn">◆</span></div>
              <div className="fc-head">
                <div><div className="fc-ovr">??</div><div className="fc-pos">???</div></div>
                <div className="fc-rank">????</div>
              </div>
              <div className="fc-player"><div className="fc-spotlight"></div><div className="fc-photo-placeholder"><span className="fc-photo-icon">?</span><span className="fc-photo-text">TU FICHA</span></div></div>
              <div className="fc-namebar"><div className="fc-name">TÚ <span className="fc-nick">&quot;?&quot;</span></div></div>
              <div className="fc-attrs">
                <div className="fca"><div className="fca-v">??</div><div className="fca-l">PAC</div></div>
                <div className="fca"><div className="fca-v">??</div><div className="fca-l">SHO</div></div>
                <div className="fca"><div className="fca-v">??</div><div className="fca-l">PAS</div></div>
                <div className="fca"><div className="fca-v">??</div><div className="fca-l">DRI</div></div>
                <div className="fca"><div className="fca-v">??</div><div className="fca-l">DEF</div></div>
                <div className="fca"><div className="fca-v">??</div><div className="fca-l">FIS</div></div>
              </div>
              <div className="fc-foot"><div className="fc-team">SIN EQUIPO AÚN</div></div>
            </div>
            <div className="ld-carta-overlay">
              <div className="ld-carta-overlay-text">Crea tu perfil gratis<br />para descubrir cómo<br />comienza tu carrera.</div>
              <button className="hb1" onClick={() => openAuth(true)}>COMENZAR AHORA</button>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-cine ld-teaser-section">
        <div className="sec-cine-bg"></div>
        <div className="sec-cine-scrim"></div>
        <div className="sec-cine-smoke"></div>
        <div className="ld-teaser-wrap">
          <div className="sec-eyebrow center" style={{ marginBottom: 24, position: "relative", zIndex: 2 }}><span className="ar">▶</span> DETRÁS DEL PERFIL <span className="ar">◀</span></div>
          <div className="ld-teaser-title">Esto es solo el comienzo.</div>
          <div className="ld-teaser-note">Hay mucho más esperándote.</div>
          <div className="ld-teaser-cta-note">Crea tu perfil para conocer más de LEVEL UP. Es totalmente gratis.</div>
          <div className="ld-teaser-grid">
            <div className="ld-teaser-card">
              <div className="ld-tc-lock">🔒</div>
              <div className="ld-tc-name">CARRERA DEPORTIVA</div>
              <div className="ld-tc-hint">Algo que evoluciona con cada partido que juegas.</div>
            </div>
            <div className="ld-teaser-card f">
              <div className="ld-tc-lock">🔒</div>
              <div className="ld-tc-name">EQUIPOS</div>
              <div className="ld-tc-hint">Construye algo más grande que tú solo.</div>
            </div>
            <div className="ld-teaser-card">
              <div className="ld-tc-lock">🔒</div>
              <div className="ld-tc-name">RANGOS</div>
              <div className="ld-tc-hint">Hay ocho niveles. La mayoría nunca llega al último.</div>
            </div>
            <div className="ld-teaser-card f">
              <div className="ld-tc-lock">🔒</div>
              <div className="ld-tc-name">TORNEOS</div>
              <div className="ld-tc-hint">Próximamente. Lo que venga después de los partidos normales.</div>
            </div>
            <div className="ld-teaser-card">
              <div className="ld-tc-lock">🔒</div>
              <div className="ld-tc-name">REY DEL BARRIO</div>
              <div className="ld-tc-hint">El título que todos quieren. Solo uno puede tenerlo.</div>
            </div>
            <div className="ld-teaser-card f">
              <div className="ld-tc-lock">🔒</div>
              <div className="ld-tc-name">Y MÁS...</div>
              <div className="ld-tc-hint">Logros. Desafíos. Mercado. Cosas que no te podemos contar aquí.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="ld-final-section">
        <div className="ld-final-glow-g"></div>
        <div className="ld-final-glow-f"></div>
        <div className="ld-final-wrap">
          <div className="ld-final-title">Estás a punto de comenzar<br /><span className="ld-final-highlight">tu carrera deportiva.</span></div>
          <button className="ld-final-btn" onClick={() => openAuth(true)}>CREAR PERFIL GRATIS</button>
          <div className="ld-final-sub">Descubre todo lo que LEVEL UP tiene preparado para ti.</div>
        </div>
      </section>
    </>
  );
}
