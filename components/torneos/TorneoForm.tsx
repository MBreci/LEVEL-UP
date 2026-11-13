"use client";

import { useState } from "react";
import { useTournaments } from "@/context/TournamentsContext";
import { CANCHAS_REGISTRADAS } from "@/lib/domain/teams";
import { coinsFmt } from "@/lib/domain/wallet";
import { pesosFmt, TN_TEAM_SIZE } from "@/lib/domain/tournaments";

export function TorneoForm({ onDone }: { onDone: () => void }) {
  const { createTournament } = useTournaments();
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [cancha, setCancha] = useState("");
  const [direccion, setDireccion] = useState("");
  const [valor, setValor] = useState("");
  const [premio1, setPremio1] = useState("");
  const [premio2, setPremio2] = useState("");
  const [premio3, setPremio3] = useState("");
  const [obs, setObs] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const porJugador = parseInt(valor, 10) || 0;
  const hint = porJugador > 0 ? (
    <>
      {pesosFmt(porJugador)}/jugador · Total equipo: <b>{pesosFmt(porJugador * TN_TEAM_SIZE)}</b> · 🪙 {coinsFmt(porJugador * TN_TEAM_SIZE)} coins
    </>
  ) : (
    "Total por equipo (8 jugadores): —"
  );

  async function submit() {
    setSubmitting(true);
    const res = await createTournament({
      nombre, fecha, horaInicio, horaFin, cancha, direccion,
      valorPorJugador: porJugador, premio1, premio2, premio3, obs,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || "No se pudo publicar el torneo.");
      return;
    }
    onDone();
  }

  return (
    <div className="tn-form-wrap" id="tn-form-wrap">
      <div className="tn-form-card">
        <div className="tn-form-title">NUEVO TORNEO</div>
        <div className="tn-form-grid">
          <div className="tn-field full">
            <label className="tn-label">NOMBRE DEL TORNEO</label>
            <input className="tn-input" autoComplete="off" placeholder="Ej: Copa Level Up — Julio 2026" maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="tn-field">
            <label className="tn-label">FECHA</label>
            <input className="tn-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="tn-field">
            <label className="tn-label">HORA DE INICIO</label>
            <input className="tn-input" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div className="tn-field">
            <label className="tn-label">HORA DE FIN (aprox.)</label>
            <input className="tn-input" type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} />
          </div>
          <div className="tn-field">
            <label className="tn-label">CANCHA</label>
            <select className="tn-input" value={cancha} onChange={(e) => setCancha(e.target.value)}>
              <option value="">Selecciona una cancha...</option>
              {CANCHAS_REGISTRADAS.map((c) => (
                <option value={c} key={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="tn-field">
            <label className="tn-label">VALOR POR JUGADOR (COP)</label>
            <input className="tn-input" type="number" min={0} placeholder="Ej: 65000" value={valor} onChange={(e) => setValor(e.target.value)} />
            <div className="tn-price-hint">{hint}</div>
          </div>
          <div className="tn-field full">
            <label className="tn-label">
              📍 DIRECCIÓN <span className="auth-note-inline" style={{ opacity: 0.6 }}>· La gente podrá abrir la ubicación en Maps</span>
            </label>
            <input className="tn-input" autoComplete="off" placeholder="Ej: Calle 170 #54-30, Bogotá (o pega el link de Google Maps)" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div className="tn-field full">
            <label className="tn-label">🥇 PRIMER PREMIO</label>
            <input className="tn-input" autoComplete="off" placeholder="Ej: $500.000 + Trofeo + Uniforme" maxLength={120} value={premio1} onChange={(e) => setPremio1(e.target.value)} />
          </div>
          <div className="tn-field">
            <label className="tn-label">🥈 SEGUNDO PREMIO</label>
            <input className="tn-input" autoComplete="off" placeholder="Ej: $200.000 + Medalla" maxLength={120} value={premio2} onChange={(e) => setPremio2(e.target.value)} />
          </div>
          <div className="tn-field">
            <label className="tn-label">🥉 TERCER PREMIO</label>
            <input className="tn-input" autoComplete="off" placeholder="Ej: $100.000" maxLength={120} value={premio3} onChange={(e) => setPremio3(e.target.value)} />
          </div>
          <div className="tn-field full">
            <label className="tn-label">OBSERVACIONES</label>
            <textarea className="tn-input tn-textarea" rows={6} placeholder="Reglas, formato, dress code, horarios, lo que quieras... sin límite." value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
        </div>
        <div className="tn-form-error">{error}</div>
        <div className="tn-form-actions">
          <button className="tn-btn-cancel" onClick={onDone}>
            CANCELAR
          </button>
          <button className="tn-btn-save" disabled={submitting} onClick={submit}>
            {submitting ? "PUBLICANDO..." : "PUBLICAR TORNEO"}
          </button>
        </div>
      </div>
    </div>
  );
}
