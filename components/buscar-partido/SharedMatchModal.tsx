"use client";

import { useEffect, useState } from "react";
import { useMatches } from "@/context/MatchesContext";
import type { OpenMatch } from "@/types/match";

export function SharedMatchModal({ matchId, onClose, onJoin }: { matchId: string; onClose: () => void; onJoin: (matchId: string, pos: string) => void }) {
  const { fetchSharedMatch } = useMatches();
  const [match, setMatch] = useState<OpenMatch | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchSharedMatch(matchId).then((m) => {
      if (!cancelled) setMatch(m);
    });
    return () => {
      cancelled = true;
    };
  }, [matchId, fetchSharedMatch]);

  if (match === undefined) {
    return (
      <div className="modal-overlay open" id="shared-match-modal">
        <div className="invite-card" id="shared-match-content" style={{ maxWidth: 480 }}>
          <div className="sm-title">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="modal-overlay open" id="shared-match-modal">
        <div className="invite-card" id="shared-match-content" style={{ maxWidth: 480 }}>
          <div className="sm-title">PARTIDO NO ENCONTRADO</div>
          <div className="sm-sub">Este partido ya no existe o el link es incorrecto.</div>
          <button className="auth-cancel" onClick={onClose}>
            CERRAR
          </button>
        </div>
      </div>
    );
  }

  const valor = match.valorPorPersona || match.precio;
  const totalCupos = match.necesita.reduce((s, n) => s + n.cupos, 0);
  const unidos = match.necesita.reduce((s, n) => s + n.unidos.length, 0);
  const libres = totalCupos - unidos;
  const prevConf = (match.confirmadosPrev || []).length;

  return (
    <div className="modal-overlay open" id="shared-match-modal">
      <div className="invite-card" id="shared-match-content" style={{ maxWidth: 480 }}>
        <div className="sm-title">⚽ PARTIDO PÚBLICO</div>
        <div className="sm-sub">{match.cancha || match.zona}</div>
        <div className="sm-grid">
          <div className="sm-row">
            <span>FORMATO</span>
            <strong>FÚTBOL {match.formato}</strong>
          </div>
          <div className="sm-row">
            <span>FECHA</span>
            <strong>{match.fecha}</strong>
          </div>
          <div className="sm-row">
            <span>CANCHA</span>
            <strong>{match.cancha || "—"}</strong>
          </div>
          {match.direccion && (
            <div className="sm-row">
              <span>DIRECCIÓN</span>
              <strong>{match.direccion}</strong>
            </div>
          )}
          <div className="sm-row">
            <span>SUPERFICIE</span>
            <strong>{match.superficie || "—"}</strong>
          </div>
          <div className="sm-row">
            <span>VALOR</span>
            <strong>{valor ? "$" + Number(valor).toLocaleString("es-CO") + " / jug" : "GRATIS"}</strong>
          </div>
          <div className="sm-row">
            <span>CUPOS ABIERTOS</span>
            <strong>{libres > 0 ? libres + " disponibles" : "COMPLETO"}</strong>
          </div>
          {prevConf > 0 && (
            <div className="sm-row">
              <span>CONFIRMADOS PREV.</span>
              <strong>{prevConf} jugadores</strong>
            </div>
          )}
          {match.ovrMin && (
            <div className="sm-row">
              <span>OVR MÍNIMO</span>
              <strong>{match.ovrMin}</strong>
            </div>
          )}
          {match.observaciones && (
            <div className="sm-row full">
              <span>NOTAS</span>
              <strong>{match.observaciones}</strong>
            </div>
          )}
        </div>
        {libres > 0 ? (
          <button
            className="auth-submit"
            style={{ marginTop: 20 }}
            onClick={() => {
              onClose();
              onJoin(match.id, "ABIERTO");
            }}
          >
            QUIERO UNIRME
          </button>
        ) : (
          <div style={{ marginTop: 16, color: "var(--td)", fontSize: 13, textAlign: "center" }}>Este partido ya no tiene cupos disponibles.</div>
        )}
        <button className="auth-cancel" onClick={onClose}>
          CERRAR
        </button>
      </div>
    </div>
  );
}
