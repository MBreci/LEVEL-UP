"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTeams } from "@/context/TeamsContext";
import { CreateTeamForm } from "@/components/equipos/CreateTeamForm";
import { TeamProfile } from "@/components/equipos/TeamProfile";
import { TeamSearch } from "@/components/equipos/TeamSearch";
import { TeamViewModal } from "@/components/equipos/TeamViewModal";
import { ChallengeModal } from "@/components/equipos/ChallengeModal";
import { EscudoLightbox } from "@/components/equipos/EscudoLightbox";
import { TeamMatchesPanel } from "@/components/equipos/TeamMatchesPanel";

type Tab = "crear" | "rey" | "programados";

function EquiposContent() {
  const { profile } = useAuth();
  const { myTeam } = useTeams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as Tab) || "rey";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);
  const [challengeTeamId, setChallengeTeamId] = useState<string | null>(null);
  const [escudoSrc, setEscudoSrc] = useState<string | null>(null);

  function switchTab(t: Tab) {
    setTab(t);
    router.replace(`/equipos?tab=${t}`);
  }

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-eyebrow">MODO COMPETITIVO</div>
        <div className="page-banner-title">👑 REY DEL BARRIO</div>
        <div className="page-banner-desc">Reta a otros equipos en canchas certificadas. Cada partido registra tu desempeño y actualiza tu ficha.</div>
      </div>

      <section id="equipos">
        <div className="eq-tabs">
          <div className={`eq-tab ${tab === "crear" ? "on" : ""}`} onClick={() => switchTab("crear")}>
            CREAR EQUIPO / MI EQUIPO
          </div>
          <div className={`eq-tab ${tab === "rey" ? "on" : ""}`} onClick={() => switchTab("rey")}>
            REY DEL BARRIO
          </div>
          <div className={`eq-tab ${tab === "programados" ? "on" : ""}`} onClick={() => switchTab("programados")}>
            PARTIDOS PROGRAMADOS
          </div>
        </div>

        <div className="eq-panel" style={{ display: tab === "crear" ? "block" : "none" }}>
          {!profile ? null : myTeam ? (
            <TeamProfile teamId={myTeam.id} onEscudoClick={setEscudoSrc} />
          ) : (
            <CreateTeamForm onEscudoClick={setEscudoSrc} />
          )}
        </div>

        <div className="eq-panel eq-panel-rey-wrap" style={{ display: tab === "rey" ? "block" : "none" }}>
          <TeamSearch onOpenTeam={setViewingTeamId} />
        </div>

        <div className="eq-panel" style={{ display: tab === "programados" ? "block" : "none" }}>
          <TeamMatchesPanel />
        </div>
      </section>

      {viewingTeamId && (
        <TeamViewModal
          teamId={viewingTeamId}
          onClose={() => setViewingTeamId(null)}
          onChallenge={setChallengeTeamId}
          onEscudoClick={setEscudoSrc}
        />
      )}
      {challengeTeamId && <ChallengeModal toTeamId={challengeTeamId} onClose={() => setChallengeTeamId(null)} />}
      {escudoSrc && <EscudoLightbox src={escudoSrc} onClose={() => setEscudoSrc(null)} />}
    </>
  );
}

export default function EquiposPage() {
  return (
    <Suspense fallback={null}>
      <EquiposContent />
    </Suspense>
  );
}
