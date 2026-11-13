import Link from "next/link";

/**
 * Puerto fiel de index-preview.html — mockup de rediseño de la landing
 * (hero a dos columnas + banners de rango), aislado de la app real. Los
 * botones son decorativos: el original tampoco carga app.js en esta página,
 * así que "CREAR PERFIL"/"INICIAR SESIÓN" nunca abrían nada ahí tampoco.
 */
export function IndexPreviewContent() {
  return (
    <>
      <header>
        <div className="nav-top">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="logo-img" src="/assets/logo.png" alt="LEVEL UP" />
          </Link>
          <nav className="nav-modules">
            <a className="nm-item nm-item-link on" href="#inicio">
              INICIO
            </a>
          </nav>
          <div className="nav-right">
            <button className="btn-g">INICIAR SESIÓN</button>
            <button className="btn-p">CREAR PERFIL</button>
          </div>
        </div>
      </header>

      <section className="hero rd-hero" id="inicio">
        <div className="hero-bg" id="hero-bg">
          <div className="hero-bg-img"></div>
          <div className="hero-bg-smoke"></div>
          <div className="hero-beams"></div>
          <div className="hero-bg-light"></div>
        </div>
        <div className="hero-glow-core"></div>
        <div className="hero-frame">
          <span className="hf-corner tl"></span>
          <span className="hf-corner tr"></span>
          <span className="hf-corner bl"></span>
          <span className="hf-corner br"></span>
        </div>
        <div className="rd-hero-inner">
          <div className="rd-hero-left">
            <div className="h-season">TEMPORADA BETA &nbsp;·&nbsp; COLOMBIA &nbsp;·&nbsp; 2026</div>
            <div className="h-sub-label">LA NUEVA ERA DEL FÚTBOL AMATEUR</div>
            <div className="h-title">
              <span className="t1">JUEGA.</span>
              <span className="t2">COMPITE.</span>
              <span className="t3">ASCIENDE.</span>
            </div>
            <div className="h-desc">Transforma cada partido en una carrera deportiva digital.</div>
            <div className="h-btns">
              <button className="hb1 hb1-neon">CREAR PERFIL</button>
              <button className="hb2">INICIAR SESIÓN</button>
            </div>
            <div className="rd-hero-stats">
              <div className="rd-hs">
                <div className="rd-hs-v">15</div>
                <div className="rd-hs-l">JUGADORES</div>
              </div>
              <div className="rd-hs">
                <div className="rd-hs-v g">8</div>
                <div className="rd-hs-l">PARTIDOS</div>
              </div>
              <div className="rd-hs">
                <div className="rd-hs-v f">42</div>
                <div className="rd-hs-l">GOLES</div>
              </div>
            </div>
          </div>
          <div className="rd-hero-right">
            <div className="rd-hero-card-glow"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="rd-hero-card" src="/assets/ranks/elite-t.png" alt="Carta LEVEL UP" />
            <div className="rd-hero-badge">
              <span>TU CARTA</span>
              <br />
              EVOLUCIONA
            </div>
          </div>
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

      <section className="rd-ranks">
        <div className="rd-ranks-glow"></div>
        <div className="sec-hdr" style={{ textAlign: "center", position: "relative", zIndex: 2, marginBottom: 8 }}>
          <div className="sec-eyebrow center">
            <span className="ar">▶</span> OCHO RANGOS <span className="ar">◀</span>
          </div>
          <div className="rd-ranks-title">
            De <span className="g">Canterano</span> a <span className="gold">GOAT</span>
          </div>
          <div className="rd-ranks-sub">Tu carrera avanza con cada partido. La mayoría nunca llega al último.</div>
        </div>
        <div className="rd-ranks-row">
          {["canterano", "debutante", "revelacion", "consagrado", "elite", "idolo", "leyenda", "goat"].map((r) => (
            <div className="rd-banner" key={r}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/assets/ranks/${r}-t.png`} alt={r} />
            </div>
          ))}
        </div>
      </section>

      <section className="sec-cine ld-imagine-section">
        <div className="sec-cine-bg"></div>
        <div className="sec-cine-scrim"></div>
        <div className="sec-cine-smoke"></div>
        <div className="sec-hdr" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px", position: "relative", zIndex: 2 }}>
          <div className="sec-eyebrow center">
            <span className="ar">▶</span> UNA IDEA <span className="ar">◀</span>
          </div>
          <div className="sec-title" style={{ fontSize: "clamp(28px,4.5vw,52px)", lineHeight: 1.1 }}>
            Imagina un lugar donde
          </div>
        </div>
        <div className="ld-imagine-grid">
          {[
            ["g", "⚡", "Completas rápido tu equipo para asegurar tu partido."],
            ["f", "🎯", "Cada partido que juegas tiene importancia más allá del marcador."],
            ["g", "🤝", "Conoces futbolistas cerca de ti que buscan exactamente lo mismo que tú."],
            ["f", "📈", "Tu rendimiento queda registrado. Y mejora partido a partido."],
            ["g", "🏆", "Tu equipo construye una reputación. Y el barrio empieza a saberlo."],
            ["f", "📖", "Tienes una historia deportiva. Una que no desaparece al final del partido."],
          ].map(([cls, icon, text], i) => (
            <div className={`ld-imagine-card ${cls}`} key={i}>
              <div className="ld-ic-icon">{icon}</div>
              <div className="ld-ic-text">{text}</div>
            </div>
          ))}
        </div>
        <div className="ld-imagine-cta" style={{ position: "relative", zIndex: 2 }}>
          <button className="ld-neon-btn">QUIERO ENTRAR</button>
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
          <div className="sec-eyebrow center">
            <span className="ar">▶</span> TU IDENTIDAD <span className="ar">◀</span>
          </div>
          <div className="ld-carta-title">
            Tu identidad deportiva
            <br />
            todavía no existe.
          </div>
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
              <div className="fc-crest">
                <span className="fc-crest-orn">◆</span> LEVEL UP <span className="fc-crest-orn">◆</span>
              </div>
              <div className="fc-head">
                <div>
                  <div className="fc-ovr">??</div>
                  <div className="fc-pos">???</div>
                </div>
                <div className="fc-rank">????</div>
              </div>
              <div className="fc-player">
                <div className="fc-spotlight"></div>
                <div className="fc-photo-placeholder">
                  <span className="fc-photo-icon">?</span>
                  <span className="fc-photo-text">TU FICHA</span>
                </div>
              </div>
              <div className="fc-namebar">
                <div className="fc-name">
                  TÚ <span className="fc-nick">&quot;?&quot;</span>
                </div>
              </div>
              <div className="fc-attrs">
                {["PAC", "SHO", "PAS", "DRI", "DEF", "FIS"].map((l) => (
                  <div className="fca" key={l}>
                    <div className="fca-v">??</div>
                    <div className="fca-l">{l}</div>
                  </div>
                ))}
              </div>
              <div className="fc-foot">
                <div className="fc-team">SIN EQUIPO AÚN</div>
              </div>
            </div>
            <div className="ld-carta-overlay">
              <div className="ld-carta-overlay-text">
                Crea tu perfil gratis
                <br />
                para descubrir cómo
                <br />
                comienza tu carrera.
              </div>
              <button className="hb1">COMENZAR AHORA</button>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-cine ld-teaser-section">
        <div className="sec-cine-bg"></div>
        <div className="sec-cine-scrim"></div>
        <div className="sec-cine-smoke"></div>
        <div className="ld-teaser-wrap">
          <div className="sec-eyebrow center" style={{ marginBottom: 24, position: "relative", zIndex: 2 }}>
            <span className="ar">▶</span> DETRÁS DEL PERFIL <span className="ar">◀</span>
          </div>
          <div className="ld-teaser-title">Esto es solo el comienzo.</div>
          <div className="ld-teaser-note">Hay mucho más esperándote.</div>
          <div className="ld-teaser-cta-note">Crea tu perfil para conocer más de LEVEL UP. Es totalmente gratis.</div>
          <div className="ld-teaser-grid">
            {[
              ["", "CARRERA DEPORTIVA", "Algo que evoluciona con cada partido que juegas."],
              ["f", "EQUIPOS", "Construye algo más grande que tú solo."],
              ["", "RANGOS", "Hay ocho niveles. La mayoría nunca llega al último."],
              ["f", "TORNEOS", "Próximamente. Lo que venga después de los partidos normales."],
              ["", "REY DEL BARRIO", "El título que todos quieren. Solo uno puede tenerlo."],
              ["f", "Y MÁS...", "Logros. Desafíos. Mercado. Cosas que no te podemos contar aquí."],
            ].map(([cls, name, hint], i) => (
              <div className={`ld-teaser-card ${cls}`} key={i}>
                <div className="ld-tc-lock">🔒</div>
                <div className="ld-tc-name">{name}</div>
                <div className="ld-tc-hint">{hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ld-final-section">
        <div className="ld-final-glow-g"></div>
        <div className="ld-final-glow-f"></div>
        <div className="ld-final-wrap">
          <div className="ld-final-title">
            Estás a punto de comenzar
            <br />
            <span className="ld-final-highlight">tu carrera deportiva.</span>
          </div>
          <button className="ld-final-btn">CREAR PERFIL GRATIS</button>
          <div className="ld-final-sub">Descubre todo lo que LEVEL UP tiene preparado para ti.</div>
        </div>
      </section>

      <footer>
        <div className="ft-top">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ft-logo-img" src="/assets/logo.png" alt="LEVEL UP" />
            <div className="ft-desc">La plataforma deportiva donde cada partido cambia tu carrera. Construido en Bogotá, Colombia.</div>
          </div>
        </div>
        <div className="ft-bottom">
          © 2026 LEVEL UP · ETAPA BETA · <Link href="/privacidad">POLÍTICA DE TRATAMIENTO DE DATOS Y DE IMAGEN</Link>
        </div>
      </footer>
    </>
  );
}
