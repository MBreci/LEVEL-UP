"use client";

import { useProfiles } from "@/context/ProfilesContext";
import { RATE_CATEGORIES, useRateModal, type RateCategory } from "@/context/RateModalContext";

const CAT_LABELS: Record<RateCategory, string> = {
  puntualidad: "PUNTUALIDAD",
  tecnica: "TÉCNICA",
  comportamiento: "COMPORTAMIENTO",
  nivel: "NIVEL",
};

export function RateModal() {
  const { targetId, stars, error, close, setStar, submit } = useRateModal();
  const { profiles } = useProfiles();
  if (!targetId) return null;
  const target = profiles[targetId];

  return (
    <div className="modal-overlay open" id="rate-modal">
      <div className="auth-card" style={{ maxWidth: 380 }}>
        <div className="auth-label">
          CALIFICAR A <span id="rate-player-name">{target ? target.nickname || target.name : ""}</span>
        </div>
        {RATE_CATEGORIES.map((cat) => (
          <div className="rate-cat" key={cat}>
            <div className="rate-cat-label">{CAT_LABELS[cat]}</div>
            <div className="rate-stars-row">
              {[1, 2, 3, 4, 5].map((v) => (
                <span
                  key={v}
                  className={`rate-star${stars[cat] >= v ? " on" : ""}`}
                  onClick={() => setStar(cat, v)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="auth-error" id="rate-error">
          {error}
        </div>
        <button className="auth-submit" onClick={submit}>
          ENVIAR CALIFICACIÓN
        </button>
        <button className="auth-cancel" onClick={close}>
          CANCELAR
        </button>
      </div>
    </div>
  );
}
