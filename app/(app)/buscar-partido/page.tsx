"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { StatChips } from "@/components/buscar-partido/StatChips";
import { MatchWizard } from "@/components/buscar-partido/MatchWizard";
import { MatchListProximos } from "@/components/buscar-partido/MatchListProximos";
import { MatchListMia } from "@/components/buscar-partido/MatchListMia";
import { MyMatchesTab } from "@/components/buscar-partido/MyMatchesTab";
import { JoinModal } from "@/components/buscar-partido/JoinModal";
import { ParticipantsModal } from "@/components/buscar-partido/ParticipantsModal";
import { SharedMatchModal } from "@/components/buscar-partido/SharedMatchModal";

type Tab = "proximos" | "mia" | "programados";

export default function BuscarPartidoPage() {
  const { profile } = useAuth();
  const { openAuth } = useAuthModal();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>("proximos");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [joinCtx, setJoinCtx] = useState<{ matchId: string; pos: string } | null>(null);
  const [participantsMatchId, setParticipantsMatchId] = useState<string | null>(null);
  const [sharedMatchId, setSharedMatchId] = useState<string | null>(() => searchParams.get("p"));
  const proximosRef = useRef<HTMLDivElement>(null);

  function handleJoin(matchId: string, pos: string) {
    if (!profile) {
      openAuth(true);
      return;
    }
    setJoinCtx({ matchId, pos });
  }

  function openCreateForm() {
    if (!profile) {
      openAuth(false);
      return;
    }
    setWizardOpen((prev) => !prev);
  }

  return (
    <>
      <div className="bp-hero">
        <div className="bp-hero-bg-layer"></div>
        <div className="bp-hero-particles">
          <span className="bp-p bp-p1"></span>
          <span className="bp-p bp-p2"></span>
          <span className="bp-p bp-p3"></span>
          <span className="bp-p bp-p4"></span>
          <span className="bp-p bp-p5"></span>
          <span className="bp-p bp-p6"></span>
        </div>
        <div className="bp-hero-content">
          <div className="bp-hero-eyebrow">MODO LIBRE · PARA TODOS</div>
          <div className="bp-hero-title">PARTIDOS</div>
          <div className="bp-hero-tagline">Juega hoy. Cualquier cancha. Cualquier formato.</div>
        </div>
      </div>

      <section id="buscar-partido">
        <StatChips onScrollToOpen={() => proximosRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

        <div className="bp-ethos">
          <div className="bp-ethos-icon">⚡</div>
          <div className="bp-ethos-body">
            <div className="bp-ethos-title">COMPROMISO Y PUNTUALIDAD</div>
            <div className="bp-ethos-text">
              La puntualidad y el compromiso hacen parte del rendimiento deportivo dentro de LEVEL UP. Si confirmas
              asistencia y no te presentas sin cancelar a tiempo, la plataforma aplicará consecuencias progresivas:
              reducción de confiabilidad, prioridad en invitaciones y advertencia en tu historial. La reincidencia
              puede llevar a suspensiones temporales. Todo jugador puede cancelar su asistencia con un mínimo de 24
              horas de anticipación.
            </div>
          </div>
        </div>

        <div className="bp-create-hero">
          <div className="bp-create-hero-glow"></div>
          <div className="bp-create-hero-content">
            <div className="bp-create-hero-title">
              Publica tu partido
              <br />y encuentra con quién jugar
            </div>
            <div className="bp-create-hero-sub" style={{ color: "var(--g)", fontWeight: 500, marginBottom: 4 }}>
              ¿Ya separaste una cancha y quieres buscar jugadores?
            </div>
            <div className="bp-create-hero-sub">
              Si ya tienes una cancha separada, publica tu partido, fija la fecha y la hora en que la reservaste, y
              cuántas personas te faltan para completar.
            </div>
            <button className="bp-create-hero-btn" onClick={openCreateForm}>
              <span className="bp-create-hero-btn-icon">+</span>
              CREAR MI PARTIDO
            </button>
          </div>
          <div className="bp-create-hero-deco">
            <div className="bp-create-deco-ring ring1"></div>
            <div className="bp-create-deco-ring ring2"></div>
            <div className="bp-create-deco-ring ring3"></div>
            <div className="bp-create-deco-ball">⚽</div>
          </div>
        </div>

        {wizardOpen && <MatchWizard onClose={() => setWizardOpen(false)} />}

        <div ref={proximosRef} className="bp-tabs">
          <div className={`bp-tab ${tab === "proximos" ? "on" : ""}`} onClick={() => setTab("proximos")}>
            PRÓXIMOS PARTIDOS
          </div>
          <div className={`bp-tab ${tab === "mia" ? "on" : ""}`} onClick={() => setTab("mia")}>
            MI PARTICIPACIÓN
          </div>
          <div className={`bp-tab ${tab === "programados" ? "on" : ""}`} onClick={() => setTab("programados")}>
            MIS PARTIDOS
          </div>
        </div>

        <div className="bp-panel" style={{ display: tab === "proximos" ? "block" : "none" }}>
          <MatchListProximos onJoin={handleJoin} onParticipants={setParticipantsMatchId} />
        </div>
        <div className="bp-panel" style={{ display: tab === "mia" ? "block" : "none" }}>
          <MatchListMia onJoin={handleJoin} onParticipants={setParticipantsMatchId} />
        </div>
        <div className="bp-panel" style={{ display: tab === "programados" ? "block" : "none" }}>
          <MyMatchesTab />
        </div>
      </section>

      {joinCtx && <JoinModal matchId={joinCtx.matchId} pos={joinCtx.pos} onClose={() => setJoinCtx(null)} />}
      {participantsMatchId && <ParticipantsModal matchId={participantsMatchId} onClose={() => setParticipantsMatchId(null)} />}
      {sharedMatchId && <SharedMatchModal matchId={sharedMatchId} onClose={() => setSharedMatchId(null)} onJoin={handleJoin} />}
    </>
  );
}
