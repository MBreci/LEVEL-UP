/**
 * Puerto fiel de index-v4.html — mockup alternativo "Mockup 2" (foto de
 * jugador de fondo). Aislado, sin auth real: los botones son decorativos,
 * igual que en el original (esta página tampoco carga app.js).
 */
export function IndexV4Content() {
  return (
    <div className="lv4">
      <nav className="lv4-nav">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo" src="/assets/logo.png" alt="LEVEL UP" />
        <div className="lv4-links">
          <a href="#">JUGAR</a>
          <a href="#">TORNEOS</a>
          <a href="#">EQUIPOS</a>
          <a href="#">RANKINGS</a>
          <a href="#">
            MODO CARRERA <span className="lv4-new">NUEVO</span>
          </a>
        </div>
        <div className="lv4-navr">
          <button className="lv4-btn ghost">INICIAR SESIÓN</button>
          <button className="lv4-btn solid">CREAR PERFIL</button>
        </div>
      </nav>

      <header className="lv4-hero lv4-hero2">
        <div className="lv4-hero-bg"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lv4-hero-player" src="/assets/player-photo.png" alt="" />
        <div className="lv4-hero2-in">
          <div className="lv4-badge2">MÁS QUE FÚTBOL, ES TU LIGA.</div>
          <h1 className="lv4-title2">
            <span className="w">EL FÚTBOL</span>
            <span className="g">TE ESTÁ ESPERANDO.</span>
          </h1>
          <div className="lv4-sub2">Encuentra jugadores, únete a partidos, compite en torneos y lleva tu carrera al siguiente nivel.</div>
          <div className="lv4-cta" style={{ justifyContent: "flex-start" }}>
            <button className="lv4-btn solid big">CREAR PERFIL GRATIS</button>
            <button className="lv4-btn ghost big">VER CÓMO FUNCIONA</button>
          </div>
          <div className="lv4-social">
            Más de <b>12.000 futbolistas</b> ya hacen parte de Level Up.
          </div>
        </div>
      </header>

      <section className="lv4-what">
        <div className="lv4-what-intro">
          <div className="bar"></div>
          <h3>¿QUÉ ES LEVEL UP?</h3>
          <p>La plataforma que convierte tu pasión en progreso. Juega, mejora, compite y construye tu historia.</p>
        </div>
        <div className="lv4-feat g">
          <div className="lv4-feat-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 10h2" />
              <path d="M16 14h2" />
              <path d="M6.17 15a3 3 0 0 1 5.66 0" />
              <circle cx="9" cy="11" r="2" />
              <rect x="2" y="5" width="20" height="14" rx="2" />
            </svg>
          </div>
          <h4>OVR</h4>
          <p>Evalúa tu habilidad</p>
        </div>
        <div className="lv4-feat g">
          <div className="lv4-feat-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
            </svg>
          </div>
          <h4>XP</h4>
          <p>Gana experiencia</p>
        </div>
        <div className="lv4-feat f">
          <div className="lv4-feat-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <h4>RANGOS</h4>
          <p>Sube de nivel y destaca</p>
        </div>
        <div className="lv4-feat f">
          <div className="lv4-feat-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
          </div>
          <h4>RANKING</h4>
          <p>Compite con los mejores</p>
        </div>
        <div className="lv4-feat g">
          <div className="lv4-feat-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
              <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
              <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
              <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
            </svg>
          </div>
          <h4>LOGROS</h4>
          <p>Desbloquea recompensas</p>
        </div>
      </section>

      <section className="lv4-how">
        <div className="lv4-how-bg"></div>
        <div className="lv4-how-hdr">CÓMO FUNCIONA</div>
        <div className="lv4-steps">
          <div className="lv4-step">
            <div className="lv4-step-n">1</div>
            <div className="lv4-step-t">JUEGA</div>
            <div className="lv4-step-vis">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
              </svg>
            </div>
            <div className="lv4-step-p">Disputa partidos y registra tu rendimiento.</div>
          </div>
          <div className="lv4-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
          <div className="lv4-step">
            <div className="lv4-step-n">2</div>
            <div className="lv4-step-t">SÉ EVALUADO</div>
            <div className="lv4-step-vis">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <path d="M9 9h.01" />
                <path d="M15 9h.01" />
              </svg>
            </div>
            <div className="lv4-step-p">Nuestro sistema analiza tu desempeño.</div>
          </div>
          <div className="lv4-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
          <div className="lv4-step">
            <div className="lv4-step-n">3</div>
            <div className="lv4-step-t">MEJORA TU OVR</div>
            <div className="lv4-step-vis">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="lv4-step-card" src="/assets/ranks/elite-t.png" alt="Carta" />
            </div>
            <div className="lv4-step-p">Aumenta tu nivel y hazte más fuerte.</div>
          </div>
          <div className="lv4-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
          <div className="lv4-step">
            <div className="lv4-step-n">4</div>
            <div className="lv4-step-t">ESCALA POSICIONES</div>
            <div className="lv4-step-vis">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
                <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
                <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
                <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
              </svg>
            </div>
            <div className="lv4-step-p">Sube en el ranking y conviértete en leyenda.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
