/**
 * Puerto fiel de wallet-preview.html — mockup de la billetera unificada de
 * Level Coins. Demo estático: el saldo (124 coins ≈ $124.000 COP) es un
 * valor fijo de muestra, igual que en el original — no conecta a Supabase.
 */
const SALDO_PESOS = 124000;

export function WalletPreviewContent() {
  const coins = Math.floor(SALDO_PESOS / 1000);

  return (
    <div className="wp-preview-page">
      <div className="pv">◆ PREVIEW · así se vería la billetera unificada · $1.000 = 1 Level Coin</div>
      <div className="wrap">
        <div className="eyebrow">MI BILLETERA</div>
        <h1>LEVEL COINS</h1>

        <div className="wcard">
          <div className="wtop">
            <div className="wrank">
              <span className="crown">👑</span>
              <div className="rk">
                CRACK DEL BARRIO
                <small>NIVEL 4</small>
              </div>
            </div>
            <span className="wchip">● EN RACHA</span>
          </div>
          <div className="wbal">
            <div className="lb">TUS LEVEL COINS</div>
            <div className="amt">
              <svg className="coin" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="#1a1205" stroke="url(#cg)" strokeWidth="2.4" />
                <circle cx="20" cy="20" r="12.5" fill="none" stroke="rgba(201,168,76,.4)" strokeWidth="1" />
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
              <span className="num">{coins.toLocaleString("es-CO")}</span>
            </div>
            <div className="unit">LEVEL COINS · TEMPORADA 1</div>
            <div className="eq">≈ ${SALDO_PESOS.toLocaleString("es-CO")} COP</div>
          </div>
          <div className="wact">
            <button className="wbtn recarga">💳 RECARGAR</button>
            <button className="wbtn mov">📊 MOVIMIENTOS</button>
          </div>
          <div className="wprog">
            <div className="pl">
              <span>
                Próximo premio: <b>Termo LEVEL UP</b>
              </span>
              <span>
                <b>124</b> / 150
              </span>
            </div>
            <div className="track">
              <div className="fill" style={{ width: "82%" }}></div>
            </div>
          </div>
        </div>

        <div className="grid2">
          <div className="mini">
            <h4>🎮 GANAS JUGANDO</h4>
            <div className="row">
              <span>Ganar partido</span>
              <b>+5</b>
            </div>
            <div className="row">
              <span>MVP</span>
              <b>+3</b>
            </div>
            <div className="row">
              <span>Ganar torneo</span>
              <b>+50</b>
            </div>
          </div>
          <div className="mini">
            <h4>💳 O RECARGAS</h4>
            <div className="row">
              <span>$10.000</span>
              <b>10 LC</b>
            </div>
            <div className="row">
              <span>$50.000</span>
              <b>50 LC</b>
            </div>
            <div className="row">
              <span>$100.000</span>
              <b>100 LC</b>
            </div>
          </div>
        </div>

        <div className="sect">
          <h3>⚽ Crear equipo · Rey del Barrio</h3>
          <p>Arma tu equipo y compite. Los fundadores lo crean gratis; los nuevos pagan con coins.</p>
          <button className="cta primary">CREAR MI EQUIPO — 👑 GRATIS (fundador)</button>
          <div className="price">Para nuevos: 25 LC ($25.000)</div>
        </div>
        <div className="sect">
          <h3>🏆 Pagar torneo</h3>
          <p>Inscribe tu equipo al torneo pagando con tus Level Coins.</p>
          <button className="cta pay">INSCRIBIR EQUIPO — 80 LC</button>
          <div className="price">= $80.000 · paga con coins ganados o recargados</div>
        </div>
        <div className="sect">
          <h3>🛒 Tienda &amp; premios</h3>
          <p>Canjea tus coins por camisetas, termos, descuentos y más.</p>
          <button className="cta primary">VER TIENDA</button>
        </div>

        <div className="note">
          <b>UNA SOLA BILLETERA 🪙</b>
          <br />
          Ganas coins jugando <b style={{ fontSize: 12, letterSpacing: 0 }}>o</b> los recargas con plata real — y con los mismos coins pagas equipos, torneos y tienda. Sin reembolsos, sin retiro a efectivo (solo se gastan dentro de LEVEL UP).
        </div>
        <div className="rate">🪙 1 Level Coin = $1.000 COP</div>
      </div>
    </div>
  );
}
