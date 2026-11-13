"use client";

import type { ApEventEntry } from "@/lib/domain/adminTeamMatch";

const PERIOD_OPTIONS: { value: string; label: string }[] = [
  { value: "1", label: "PRIMER TIEMPO" },
  { value: "2", label: "SEGUNDO TIEMPO" },
  { value: "et1", label: "TIEMPO EXTRA 1" },
  { value: "et2", label: "TIEMPO EXTRA 2" },
  { value: "pen", label: "PENALTIS" },
];

/**
 * Puerto fiel del grid .ap-bottom de admin-partido.html (~453-508): Eventos /
 * Timer / Notas / Acciones. El botón MVP (.ap-mvp-btn) existe en el CSS
 * original pero NUNCA se renderiza en el markup — a propósito no se agrega
 * acá tampoco (replicar la funcionalidad inalcanzable tal cual).
 */
export function BottomPanels({
  events,
  timerLabel,
  timerRunning,
  onAddTime,
  onToggleTimer,
  period,
  onPeriodChange,
  notes,
  onNotesChange,
  notesEditable,
  done,
  correcting,
  onStartCorrection,
  onSaveCorrection,
  onFinalize,
  onSaveDraft,
  onCancel,
  autosaveLabel,
  adminName,
}: {
  events: ApEventEntry[];
  timerLabel: string;
  timerRunning: boolean;
  onAddTime: (mins: number) => void;
  onToggleTimer: () => void;
  period: string;
  onPeriodChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  notesEditable: boolean;
  done: boolean;
  correcting: boolean;
  onStartCorrection: () => void;
  onSaveCorrection: () => void;
  onFinalize: () => void;
  onSaveDraft: () => void;
  onCancel: () => void;
  autosaveLabel: string;
  adminName: string;
}) {
  return (
    <>
      <div className="ap-bottom">
        <div className="ap-panel">
          <div className="ap-panel-title">EVENTOS DEL PARTIDO</div>
          <div className="ap-events-list">
            {events.length === 0 ? (
              <div style={{ color: "var(--td)", fontSize: 11, fontStyle: "italic" }}>Los eventos aparecerán aquí al registrar acciones...</div>
            ) : (
              events.map((e, i) => (
                <div className="ap-event-item" key={i}>
                  <span className="ap-event-min">{e.min}&apos;</span>
                  <span className="ap-event-dot" style={{ background: e.dotColor }}></span>
                  <span className="ap-event-text">{e.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ap-panel">
          <div className="ap-panel-title">MINUTO ACTUAL</div>
          <div className="ap-timer-display">{timerLabel}</div>
          <div className="ap-timer-btns">
            <button className="ap-addtime-btn" onClick={() => onAddTime(1)}>
              +1 MIN
            </button>
            <button className="ap-addtime-btn" onClick={() => onAddTime(5)}>
              +5 MIN
            </button>
            <button className="ap-addtime-btn" onClick={() => onAddTime(10)}>
              +10 MIN
            </button>
          </div>
          <button className={`ap-toggle-btn ${timerRunning ? "running" : ""}`} onClick={onToggleTimer}>
            <span>{timerRunning ? "DETENER" : "INICIAR / DETENER"}</span>
          </button>
          <div style={{ marginTop: 8 }}>
            <select className="ap-period-select" value={period} onChange={(e) => onPeriodChange(e.target.value)}>
              {PERIOD_OPTIONS.map((o) => (
                <option value={o.value} key={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="ap-panel">
          <div className="ap-panel-title">NOTAS DEL PARTIDO</div>
          <textarea
            className="ap-notes-ta"
            maxLength={500}
            placeholder="Escribe notas importantes del partido..."
            value={notes}
            disabled={!notesEditable}
            onChange={(e) => onNotesChange(e.target.value)}
          />
          <div className="ap-notes-count">
            <span>{notes.length}</span>/500
          </div>
        </div>

        <div className="ap-panel ap-actions">
          {done && !correcting && (
            <button className="ap-btn-draft" onClick={onStartCorrection}>
              CORREGIR DATOS CARGADOS
            </button>
          )}
          <button className="ap-btn-finalize" disabled={done && !correcting} onClick={correcting ? onSaveCorrection : onFinalize}>
            {correcting ? "GUARDAR CORRECCIÓN" : "FINALIZAR Y ENVIAR ESTADÍSTICAS"}
          </button>
          <button className="ap-btn-draft" onClick={onSaveDraft}>
            GUARDAR BORRADOR
          </button>
          <button className="ap-btn-cancel" onClick={onCancel}>
            CANCELAR PARTIDO
          </button>
        </div>
      </div>

      <div className="ap-statusbar">
        <div className="ap-conn">
          <div className="ap-conn-dot"></div>
          CONEXIÓN ESTABLE
        </div>
        <div className="ap-admin-lbl">
          ADMIN: <strong>{adminName}</strong>
        </div>
        <div className="ap-autosave-lbl">{autosaveLabel}</div>
      </div>
    </>
  );
}
