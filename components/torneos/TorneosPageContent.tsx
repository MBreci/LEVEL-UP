"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTournaments } from "@/context/TournamentsContext";
import { TorneoForm } from "@/components/torneos/TorneoForm";
import { TorneoCard } from "@/components/torneos/TorneoCard";
import { PaymentModal } from "@/components/torneos/PaymentModal";
import type { Team } from "@/types/team";
import type { Tournament } from "@/types/tournament";

export function TorneosPageContent() {
  const { isAdmin } = useAuth();
  const { tournaments } = useTournaments();
  const [formOpen, setFormOpen] = useState(false);
  const [payment, setPayment] = useState<{ tournament: Tournament; myTeam: Team } | null>(null);

  const list = Object.values(tournaments).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  return (
    <>
      <div className="tn-hero">
        <div className="tn-hero-glow tn-hero-glow-gold"></div>
        <div className="tn-hero-glow tn-hero-glow-mag"></div>
        <div className="tn-hero-content">
          <div className="tn-hero-eyebrow">COMPETENCIA OFICIAL</div>
          <div className="tn-hero-title">TORNEOS</div>
          <div className="tn-hero-desc">Equipos completos, enfrentamientos directos y un campeón que se lleva todo.</div>
        </div>
        <div className="tn-hero-art">
          <div className="tn-hero-orb"></div>
          <div className="tn-hero-trophy">🏆</div>
        </div>
      </div>

      <section id="torneos" style={{ padding: "40px 0 80px" }}>
        <div className="tn-wrap">
          {isAdmin && (
            <div id="tn-admin-bar" style={{ marginBottom: 32 }}>
              <button className="tn-create-btn" onClick={() => setFormOpen((v) => !v)}>
                <span id="tn-create-btn-lbl">{formOpen ? "✕ CANCELAR" : "+ CREAR TORNEO"}</span>
              </button>
            </div>
          )}

          {formOpen && <TorneoForm onDone={() => setFormOpen(false)} />}

          <div id="tn-list">
            {list.length ? (
              list.map((t) => <TorneoCard tournament={t} onOpenPayment={(tour, team) => setPayment({ tournament: tour, myTeam: team })} key={t.id} />)
            ) : (
              <div className="tn-empty">
                <div className="tn-empty-icon">🏆</div>
                <div className="tn-empty-title">No hay torneos activos</div>
                <div className="tn-empty-sub">{isAdmin ? "Crea el primer torneo con el botón de arriba." : "Pronto se publicará el próximo torneo. Asegúrate de tener tu equipo completo (8 jugadores)."}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {payment && <PaymentModal tournament={payment.tournament} myTeam={payment.myTeam} onClose={() => setPayment(null)} />}
    </>
  );
}
