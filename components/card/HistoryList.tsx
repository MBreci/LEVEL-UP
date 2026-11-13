import type { Profile } from "@/types/profile";

export function HistoryList({ profile }: { profile: Profile }) {
  if (!profile.history.length) {
    return <div className="notif-empty">Aún no tienes partidos. Pulsa &quot;JUGAR PARTIDO&quot; para crear tu primer historial.</div>;
  }
  const rows = [...profile.history].reverse();
  return (
    <>
      {rows.map((h, i) => (
        <div className="hist-row" key={h.matchId ?? i}>
          <div className="hist-date">{h.date}</div>
          <div className="hist-result">{h.result}</div>
          <div className={`hist-mvp ${h.mvp ? "yes" : "no"}`}>{h.mvp ? "★ MVP" : "—"}</div>
          <div className={`hist-ovr ${h.ovrDelta >= 0 ? "up" : "down"}`}>
            {h.ovrDelta >= 0 ? "+" : ""}
            {h.ovrDelta} OVR
          </div>
        </div>
      ))}
    </>
  );
}
