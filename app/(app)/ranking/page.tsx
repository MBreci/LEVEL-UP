import { RankingTable } from "@/components/ranking/RankingTable";

export default function RankingPage() {
  return (
    <>
      <div className="page-banner">
        <div className="page-banner-eyebrow">COMPETENCIA</div>
        <div className="page-banner-title">RANKING GENERAL</div>
        <div className="page-banner-desc">Así se ven todos los jugadores registrados en LEVEL UP, ordenados por OVR.</div>
      </div>
      <RankingTable />
    </>
  );
}
