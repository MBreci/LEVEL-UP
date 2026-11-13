export type RankPosGroup = "ALL" | "DEL" | "MED" | "DEF" | "POR";

const RK_POS: Record<Exclude<RankPosGroup, "ALL">, string[]> = {
  DEL: ["DEL"],
  MED: ["MED"],
  DEF: ["DEF"],
  POR: ["POR", "GK", "ARQUERO"],
};

/** Los porteros pueden venir como POR/GK/ARQUERO en datos viejos; se normalizan a un grupo. */
export function rkPosGroup(pos: string): Exclude<RankPosGroup, "ALL"> {
  for (const g of Object.keys(RK_POS) as Exclude<RankPosGroup, "ALL">[]) {
    if (RK_POS[g].includes(pos)) return g;
  }
  return "DEL";
}

export const POS_LABELS: Record<RankPosGroup, string> = {
  DEL: "DELANTEROS",
  MED: "MEDIOCAMPISTAS",
  DEF: "DEFENSAS",
  POR: "PORTEROS",
  ALL: "RANKING GENERAL",
};
