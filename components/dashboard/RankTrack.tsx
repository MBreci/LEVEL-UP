import { RANKS } from "@/lib/domain/rank";
import { HW_RANK_INFO } from "@/lib/domain/dashboardContent";

export function RankTrack() {
  return (
    <div className="hw-rank-track" id="hw-rank-track">
      {RANKS.map((r, i) => {
        const info = HW_RANK_INFO[r.name] || { desc: "", perk: "" };
        return (
          <div className={`hw-rank-card rk-${r.slug}`} key={r.slug}>
            <div className="hw-rank-fx"></div>
            {r.slug === "goat" && <div className="fc-cosmos"></div>}
            <div className="hw-rank-top">
              <span className="hw-rank-emoji">{r.emoji}</span>
              <span className="hw-rank-num">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="hw-rank-badge">{r.name}</div>
            <div className="hw-rank-tagline">{r.tagline}</div>
            <div className="hw-rank-ovr">DESDE {r.min.toLocaleString("es")} XP</div>
            <div className="hw-rank-desc">{info.desc}</div>
            {info.perk && (
              <div className="hw-rank-perk">
                <span className="hw-rank-perk-ico">✦</span>
                {info.perk}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
