import Link from "next/link";

export function AppFooter() {
  return (
    <footer>
      <div className="ft-top">
        <div>
          <img className="ft-logo-img" src="/assets/logo.png" alt="LEVEL UP" />
          <div className="ft-desc">
            La plataforma deportiva donde cada partido cambia tu carrera. Construido en Bogotá, Colombia.
          </div>
        </div>
      </div>
      <div className="ft-bottom">
        © 2026 LEVEL UP · ETAPA BETA · <Link href="/privacidad">POLÍTICA DE TRATAMIENTO DE DATOS Y DE IMAGEN</Link>
      </div>
    </footer>
  );
}
