import type { Profile } from "@/types/profile";

function badgeClass(a: string): string {
  if (/oro/i.test(a)) return " gold";
  if (/plata/i.test(a)) return " silver";
  if (/bronce/i.test(a)) return " bronze";
  return "";
}

function Metric({ label, val, unit }: { label: string; val: number | null | undefined; unit?: string }) {
  if (val === null || val === undefined || (val as unknown as string) === "") return null;
  return (
    <div className="pf-metric">
      <div className="pf-metric-v">
        {val}
        <span className="pf-metric-u">{unit || ""}</span>
      </div>
      <div className="pf-metric-l">{label}</div>
    </div>
  );
}

const DEFAULT_RECO =
  "A partir de ahora, el cuerpo técnico de LEVEL UP registrará tu desempeño partido a partido para darte recomendaciones personalizadas: qué potenciar, qué corregir y cómo llevar tu juego al siguiente nivel. ¡Sigue sumando minutos en la cancha!";

export function PerfilMetrics({ profile }: { profile: Profile }) {
  const perf = profile.physical?.perfil || null;
  const achievements = Array.isArray(profile.achievements) ? profile.achievements.filter((a) => typeof a === "string") : [];
  const reco = perf?.recomendacion || DEFAULT_RECO;

  const metricCards = perf
    ? [
        <Metric key="vel" label="VELOCIDAD MÁXIMA" val={perf.vel_max_kmh} unit=" km/h" />,
        <Metric key="dist" label="DISTANCIA RECORRIDA" val={perf.distancia_km} unit=" km" />,
        <Metric key="velmed" label="VELOCIDAD MEDIA" val={perf.vel_media_kmh} unit=" km/h" />,
        <Metric key="sprints" label="SPRINTS" val={perf.sprints} />,
        <Metric key="carreras" label="CARRERAS DE INTENSIDAD" val={perf.carreras_intensidad} />,
      ]
    : [];
  const hasMetrics = metricCards.some((m) => m !== null);

  return (
    <>
      {achievements.length > 0 && (
        <>
          <div className="pf-badges-title">RECONOCIMIENTOS</div>
          <div className="pf-badges">
            {achievements.map((a, i) => (
              <span className={`pf-badge${badgeClass(a)}`} key={i}>
                {a}
              </span>
            ))}
          </div>
        </>
      )}
      {hasMetrics && (
        <>
          <div className="pf-metrics-title">MÉTRICAS DE DESEMPEÑO</div>
          <div className="pf-metrics-grid">{metricCards}</div>
          {perf?.fuente && <div className="pf-note">Datos {perf.fuente}. Se actualizarán con la medición oficial del VEO.</div>}
        </>
      )}
      <div className="pf-reco">
        <div className="pf-reco-title">🎯 RECOMENDACIONES PARA MEJORAR TU JUEGO</div>
        <p>{reco}</p>
      </div>
    </>
  );
}
