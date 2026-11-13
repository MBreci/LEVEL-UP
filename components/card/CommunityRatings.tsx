import type { Profile } from "@/types/profile";

const CATS: { key: string; label: string }[] = [
  { key: "puntualidad", label: "PUNTUALIDAD" },
  { key: "tecnica", label: "TÉCNICA" },
  { key: "comportamiento", label: "COMPORTAMIENTO" },
  { key: "nivel", label: "NIVEL" },
];

function stars(val: number): string {
  const full = Math.round(val);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export function CommunityRatings({ profile }: { profile: Profile }) {
  const cr = profile.communityRatings || {};
  const totalVotes = cr.puntualidad ? cr.puntualidad.count : 0;

  return (
    <div className="cr-section">
      <div className="cr-title">
        CALIFICACIONES DE LA COMUNIDAD
        {totalVotes > 0 && <span className="cr-count"> · {totalVotes} valoraciones</span>}
      </div>
      {totalVotes === 0 ? (
        <div className="cr-empty">Aún no tienes valoraciones de compañeros.</div>
      ) : (
        CATS.map((c) => {
          const d = cr[c.key] || { sum: 0, count: 0 };
          const avg = d.count > 0 ? d.sum / d.count : 0;
          return (
            <div className="cr-row" key={c.key}>
              <div className="cr-label">{c.label}</div>
              <div className={`cr-stars ${avg >= 4 ? "high" : avg >= 3 ? "mid" : "low"}`}>{stars(avg)}</div>
              <div className="cr-val">{avg.toFixed(1)}</div>
            </div>
          );
        })
      )}
    </div>
  );
}
