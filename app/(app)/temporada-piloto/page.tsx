import { WipGrid } from "@/components/wip/WipGrid";

export default function TemporadaPilotoPage() {
  return (
    <>
      <div className="page-banner">
        <div className="page-banner-eyebrow">ETAPA PILOTO</div>
        <div className="page-banner-title">TEMPORADA BETA</div>
        <div className="page-banner-desc">
          LEVEL UP está en su Temporada Piloto: estamos construyendo la plataforma junto a los primeros jugadores de Bogotá.
        </div>
      </div>
      <section id="temporada">
        <div className="tp-card">
          <div className="tp-title">¿QUÉ ES LA TEMPORADA BETA?</div>
          <p className="tp-text">
            Es la primera fase de LEVEL UP: un grupo reducido de jugadores construye su carrera deportiva digital
            mientras perfeccionamos la plataforma. Cada partido que juegas ayuda a definir cómo evolucionan tu OVR, tu
            rango y tu ranking.
          </p>
        </div>
        <div className="tp-card">
          <div className="tp-title">PRÓXIMAMENTE</div>
          <WipGrid />
        </div>
      </section>
    </>
  );
}
