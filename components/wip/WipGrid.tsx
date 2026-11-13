"use client";

import { useWipModal } from "@/context/WipModalContext";
import { WIP_MODULES } from "@/lib/domain/rank";

export function WipGrid() {
  const { openWip } = useWipModal();
  return (
    <div className="wip-grid" id="wip-grid">
      {WIP_MODULES.map((m) => (
        <div className="wip-tile" key={m.name} onClick={() => openWip(m.name)}>
          <div className="wip-tile-stripes"></div>
          <div className="wip-tile-icon">{m.icon}</div>
          <div className="wip-tile-name">{m.name}</div>
          <div className="wip-tile-tag">EN CONSTRUCCIÓN</div>
        </div>
      ))}
    </div>
  );
}
