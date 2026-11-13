import { getRank } from "@/lib/domain/rank";
import { playerTeamLabel, isTeamCaptain } from "@/lib/domain/teams";
import { PhysicalPills } from "@/components/card/PhysicalPills";
import type { Profile } from "@/types/profile";
import type { Team } from "@/types/team";

const EPIC_RANKS = ["elite", "consagrado", "idolo", "leyenda", "goat"];

export function PlayerCard({
  profile,
  isMe,
  teams = {},
}: {
  profile: Profile;
  isMe: boolean;
  teams?: Record<string, Team>;
}) {
  const rank = getRank(profile.xp || 0);
  const a = profile.attrs;
  const tier = rank.slug;
  const epic = EPIC_RANKS.includes(tier);
  const className = `fifa rk-${tier}${epic ? " epic" : ""}`;
  const captain = isTeamCaptain(profile, teams);

  return (
    <div className={className} id="fifa-card">
      <div className="fc-shine"></div>
      <div className="fc-fx"></div>
      {tier === "goat" && <div className="fc-cosmos"></div>}
      {epic && <div className="fc-sparks"></div>}
      <span className="fc-corner tl"></span>
      <span className="fc-corner tr"></span>
      <span className="fc-corner bl"></span>
      <span className="fc-corner br"></span>
      <div className="fc-crest">
        <span className="fc-crest-orn">◆</span> LEVEL UP <span className="fc-crest-orn">◆</span>
      </div>
      <div className="fc-head">
        <div>
          <div className="fc-ovr">{profile.ovr}</div>
          <div className="fc-pos">{profile.position}</div>
        </div>
        <div className="fc-rank">
          <span className="fc-rank-emoji">{rank.emoji}</span>
          {rank.name}
        </div>
      </div>
      <div className="fc-player">
        <div className="fc-spotlight"></div>
        {profile.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="fc-photo-img" src={profile.photo} alt={profile.nickname || profile.name} />
        ) : (
          <div className="fc-photo-placeholder">
            <span className="fc-photo-icon">📷</span>
            <span className="fc-photo-text">
              {isMe ? "TU FOTO SE TOMARÁ EN TU PRIMER PARTIDO EN LA CANCHA" : "AÚN SIN FOTO OFICIAL"}
            </span>
          </div>
        )}
      </div>
      <div className="fc-namebar">
        <div className="fc-name">
          {profile.name}
          {profile.nickname && <span className="fc-nick"> &quot;{profile.nickname}&quot;</span>}
        </div>
      </div>
      <div className="fc-attrs">
        <div className="fca">
          <div className="fca-v">{a.pac}</div>
          <div className="fca-l">PAC</div>
        </div>
        <div className="fca">
          <div className="fca-v">{a.sho}</div>
          <div className="fca-l">SHO</div>
        </div>
        <div className="fca">
          <div className="fca-v">{a.pas}</div>
          <div className="fca-l">PAS</div>
        </div>
        <div className="fca">
          <div className="fca-v">{a.dri}</div>
          <div className="fca-l">DRI</div>
        </div>
        <div className="fca">
          <div className="fca-v">{a.def}</div>
          <div className="fca-l">DEF</div>
        </div>
        <div className="fca">
          <div className="fca-v">{a.fis}</div>
          <div className="fca-l">FIS</div>
        </div>
      </div>
      <div className="fc-foot">
        <div className="fc-team">
          {playerTeamLabel(profile, teams)}
          {captain && <span className="fc-captain-badge"> ⭐ CAPITÁN</span>}
        </div>
        <PhysicalPills physical={profile.physical} />
      </div>
    </div>
  );
}
