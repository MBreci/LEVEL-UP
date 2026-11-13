"use client";

import { useAuth } from "@/context/AuthContext";
import { useTeams } from "@/context/TeamsContext";
import { useEnsureOwnPhotos } from "@/hooks/useEnsureOwnPhotos";
import { PlayerCard } from "@/components/card/PlayerCard";
import { PlayerInfoPanel } from "@/components/card/PlayerInfoPanel";
import { CommunityRatings } from "@/components/card/CommunityRatings";
import { PerfilMetrics } from "@/components/card/PerfilMetrics";
import { PhotoProcessSection } from "@/components/card/PhotoProcessSection";
import { HistoryList } from "@/components/card/HistoryList";

export default function CartaPage() {
  const { profile } = useAuth();
  const { teams } = useTeams();
  useEnsureOwnPhotos();

  if (!profile) return null;

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-eyebrow">MI IDENTIDAD</div>
        <div className="page-banner-title">MI CARTA</div>
        <div className="page-banner-desc">Tu identidad deportiva digital. Cada partido cambia tu carta, tu OVR y tu rango.</div>
      </div>

      <section id="carta">
        <div className="card-section">
          <div className="card-left-col">
            <PlayerCard profile={profile} isMe teams={teams} />
            <div id="card-ratings">
              <CommunityRatings profile={profile} />
            </div>
          </div>
          <PlayerInfoPanel profile={profile} teams={teams} />
        </div>
        <div className="perfil-jugador-hdr">
          <div className="perfil-jugador-eyebrow">◆ LEVEL UP ◆</div>
          <div className="perfil-jugador-title">PERFIL DEL JUGADOR</div>
          <div className="perfil-jugador-sub">Desempeño, métricas y análisis en la cancha</div>
        </div>
        <PhotoProcessSection profile={profile} />
        <div className="perfil-metrics" id="perfil-metrics">
          <PerfilMetrics profile={profile} />
        </div>
      </section>

      <section id="historial">
        <div className="sec-hdr">
          <div className="sec-eyebrow">HISTORIAL DE PARTIDOS</div>
        </div>
        <div className="hist-list" id="hist-list">
          <HistoryList profile={profile} />
        </div>
      </section>
    </>
  );
}
