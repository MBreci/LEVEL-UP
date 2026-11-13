"use client";

import { useWipModal } from "@/context/WipModalContext";

export function WipModal() {
  const { moduleName, closeWip } = useWipModal();
  if (!moduleName) return null;
  return (
    <div className="modal-overlay open" id="wip-modal">
      <div className="wip-card">
        <div className="tape tape-top"></div>
        <div className="wip-icon">🚧</div>
        <div className="wip-title" id="wip-modal-title">
          {moduleName}
        </div>
        <div className="wip-sub">TRABAJO EN PROGRESO</div>
        <div className="wip-text">
          Esta sección llegará pronto a LEVEL UP. Estamos enfocados en perfeccionar tu carta, tu OVR y tu progreso primero.
        </div>
        <button className="wip-close" onClick={closeWip}>
          CERRAR
        </button>
        <div className="tape tape-bottom"></div>
      </div>
    </div>
  );
}
