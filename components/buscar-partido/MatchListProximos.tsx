"use client";

import { useMemo, useRef, useState } from "react";
import { useMatches } from "@/context/MatchesContext";
import { MatchCard } from "@/components/buscar-partido/MatchCard";
import { applyBpFilters, EMPTY_BP_FILTERS, getMatchEstado, getTotalCupos, getTotalUnidos, matchDateTime, type BpFilters } from "@/lib/domain/matches";

const ZONAS = ["Chapinero", "Usaquén", "Suba", "Engativá", "Kennedy", "Teusaquillo", "Fontibón", "Ciudad Bolívar", "Bosa", "Santa Fe"];

export function MatchListProximos({ onJoin, onParticipants }: { onJoin: (matchId: string, pos: string) => void; onParticipants: (matchId: string) => void }) {
  const { openMatches } = useMatches();
  const [filters, setFilters] = useState<BpFilters>(EMPTY_BP_FILTERS);
  const [advOpen, setAdvOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  function patch(p: Partial<BpFilters>) {
    setFilters((prev) => ({ ...prev, ...p }));
  }

  function quickChip(key: string) {
    const today = new Date().toISOString().split("T")[0];
    const next: BpFilters = { ...EMPTY_BP_FILTERS };
    if (key === "hoy" || key === "noche") next.fecha = today;
    if (key === "f5") next.formato = "5";
    if (key === "f7") next.formato = "7";
    if (key === "f11") next.formato = "11";
    if (key === "cupos") next.cupos = true;
    setFilters(next);
  }

  const activeChip = useMemo<string | null>(() => {
    const today = new Date().toISOString().split("T")[0];
    if (filters.fecha === today && !filters.formato && !filters.cupos) return "hoy";
    if (filters.formato === "5") return "f5";
    if (filters.formato === "7") return "f7";
    if (filters.formato === "11") return "f11";
    if (filters.cupos) return "cupos";
    return null;
  }, [filters]);

  const list = useMemo(() => {
    const hasFreeSpot = (m: (typeof openMatches)[number]) => getTotalCupos(m) - getTotalUnidos(m) > 0;
    const isPriority = (m: (typeof openMatches)[number]) => (m.prioritario && hasFreeSpot(m) ? 1 : 0);
    return applyBpFilters(
      openMatches.filter((m) => getMatchEstado(m) !== "finalizado"),
      filters
    ).sort((a, b) => isPriority(b) - isPriority(a) || matchDateTime(a).getTime() - matchDateTime(b).getTime());
  }, [openMatches, filters]);

  return (
    <>
      <div className="bp-search-section">
        <div className="bp-search-section-hdr">
          <div className="bp-search-section-title">BUSCAR PARTIDOS</div>
          <div className="bp-search-section-sub">Filtra por zona, cancha, fecha o formato</div>
        </div>

        <div className="bps-wrap">
          <div className="bps-chips">
            <button className={`bps-chip ${activeChip === "hoy" ? "on" : ""}`} onClick={() => quickChip("hoy")}>🔥 Hoy</button>
            <button className={`bps-chip ${activeChip === "noche" ? "on" : ""}`} onClick={() => quickChip("noche")}>🌙 Esta noche</button>
            <button className={`bps-chip ${activeChip === "f5" ? "on" : ""}`} onClick={() => quickChip("f5")}>⚽ Fútbol 5</button>
            <button className={`bps-chip ${activeChip === "f7" ? "on" : ""}`} onClick={() => quickChip("f7")}>⚽ Fútbol 7</button>
            <button className={`bps-chip ${activeChip === "f11" ? "on" : ""}`} onClick={() => quickChip("f11")}>⚽ Fútbol 11</button>
            <button className={`bps-chip ${activeChip === "cupos" ? "on" : ""}`} onClick={() => quickChip("cupos")}>🟢 Con cupos</button>
            <button className={`bps-chip bps-chip-genero ${filters.genero === "MASCULINO" ? "on" : ""}`} onClick={() => patch({ genero: filters.genero === "MASCULINO" ? "" : "MASCULINO" })}>♂ Masculino</button>
            <button className={`bps-chip bps-chip-genero ${filters.genero === "FEMENINO" ? "on" : ""}`} onClick={() => patch({ genero: filters.genero === "FEMENINO" ? "" : "FEMENINO" })}>♀ Femenino</button>
            <button className={`bps-chip bps-chip-genero ${filters.genero === "MIXTO" ? "on" : ""}`} onClick={() => patch({ genero: filters.genero === "MIXTO" ? "" : "MIXTO" })}>⚧ Mixto</button>
            <button className="bps-chip" onClick={() => setFilters(EMPTY_BP_FILTERS)}>✕ Limpiar</button>
          </div>

          <div className="bps-panel">
            <div className="bps-panel-glow"></div>
            <div className="bps-main-row">
              <div className="bps-field">
                <span className="bps-icon">📍</span>
                <select className="bps-input" value={filters.zona} onChange={(e) => patch({ zona: e.target.value })}>
                  <option value="">Ciudad / Barrio</option>
                  {ZONAS.map((z) => (
                    <option key={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div className="bps-divider"></div>
              <div className="bps-field">
                <span className="bps-icon">⚽</span>
                <input className="bps-input" autoComplete="off" placeholder="Cancha" value={filters.cancha} onChange={(e) => patch({ cancha: e.target.value })} />
              </div>
              <div className="bps-divider"></div>
              <div className="bps-field">
                <span className="bps-icon">📅</span>
                <input className="bps-input" type="date" value={filters.fecha} onChange={(e) => patch({ fecha: e.target.value })} />
              </div>
              <div className="bps-divider"></div>
              <div className="bps-field">
                <span className="bps-icon">🥅</span>
                <select className="bps-input" value={filters.formato} onChange={(e) => patch({ formato: e.target.value })}>
                  <option value="">Tipo de fútbol</option>
                  <option value="5">Fútbol 5</option>
                  <option value="6">Fútbol 6</option>
                  <option value="7">Fútbol 7</option>
                  <option value="8">Fútbol 8</option>
                  <option value="11">Fútbol 11</option>
                </select>
              </div>
              <button className="bps-search-btn">BUSCAR</button>
            </div>

            <button className="bps-adv-toggle" onClick={() => setAdvOpen(!advOpen)}>
              {advOpen ? "▲" : "▼"} Filtros avanzados
            </button>
            <div className={`bps-adv-panel${advOpen ? " open" : ""}`}>
              <div className="bps-adv-grid">
                <div className="bps-adv-field">
                  <label className="bps-adv-label">⭐ OVR máximo</label>
                  <input className="bps-adv-input" type="number" placeholder="Ej: 75" value={filters.ovr} onChange={(e) => patch({ ovr: e.target.value })} />
                </div>
                <div className="bps-adv-field">
                  <label className="bps-adv-label">💵 Precio máximo</label>
                  <input className="bps-adv-input" type="number" placeholder="Ej: 30000" value={filters.precio} onChange={(e) => patch({ precio: e.target.value })} />
                </div>
                <label className="bps-adv-check">
                  <input type="checkbox" checked={filters.cupos} onChange={(e) => patch({ cupos: e.target.checked })} />
                  <span>🟢 Solo con cupos disponibles</span>
                </label>
                <label className="bps-adv-check">
                  <input type="checkbox" checked={filters.abiertos} onChange={(e) => patch({ abiertos: e.target.checked })} />
                  <span>🔓 Solo partidos abiertos</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div ref={listRef} className="bp-list-grid" id="bp-list-proximos">
        {list.length ? (
          list.map((m) => <MatchCard key={m.id} match={m} mode="proximos" onJoin={onJoin} onParticipants={onParticipants} />)
        ) : (
          <div className="bp-empty">No hay partidos próximos con estos filtros. Publica el tuyo.</div>
        )}
      </div>
    </>
  );
}
