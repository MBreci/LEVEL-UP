"use client";

import { useRef, useState } from "react";
import "./estado.css";
import { getSupabase } from "@/lib/supabase/client";

type CheckStatus = "pending" | "ok" | "bad";

interface CheckState {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

const INITIAL_CHECKS: CheckState[] = [
  { id: "lib", label: "Cargó la librería de la base", status: "pending", detail: "" },
  { id: "read", label: "LEER de la base (GET)", status: "pending", detail: "" },
  { id: "rpc", label: "FUNCIÓN de la base (RPC)", status: "pending", detail: "" },
  { id: "write", label: "ESCRIBIR en la base (POST) ← lo que falla al guardar/registrar", status: "pending", detail: "" },
];

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT (${ms}ms) — la conexión no respondió`)), ms));
}

async function race<T>(p: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([Promise.resolve(p), timeout(ms)]);
}

/**
 * Puerto fiel de estado.html — diagnóstico manual de conectividad con
 * Supabase para que un jugador con problemas de red le mande la captura a
 * soporte. Usa el mismo cliente tipado del resto de la app (getSupabase())
 * en vez de instanciar uno nuevo con una clave suelta en el HTML — mismo
 * proyecto, misma clave (ahora vía .env.local), mismas 4 pruebas.
 */
export function EstadoContent() {
  const [checks, setChecks] = useState<CheckState[] | null>(null);
  const [verdict, setVerdict] = useState<{ ok: boolean; html: React.ReactNode } | null>(null);
  const [env, setEnv] = useState("");
  const logRef = useRef<string[]>([]);

  function setCheck(id: string, ok: boolean, detail: string) {
    setChecks((prev) => {
      const next = (prev || INITIAL_CHECKS).map((c) => (c.id === id ? { ...c, status: ok ? ("ok" as const) : ("bad" as const), detail } : c));
      const label = next.find((c) => c.id === id)?.label || id;
      logRef.current.push(`${ok ? "OK" : "FALLO"} · ${label} · ${detail}`);
      return next;
    });
  }

  function finish(finalChecks: CheckState[]) {
    const bad = finalChecks.filter((c) => c.status === "bad").length;
    if (bad === 0) {
      setVerdict({ ok: true, html: "✅ Todo funciona en esta red. La base responde y se puede leer y escribir. Si te falló antes, prueba de nuevo — puede haber sido una microcaída de señal." });
    } else {
      const readOk = finalChecks.find((c) => c.id === "read")?.status === "ok";
      const writeOk = finalChecks.find((c) => c.id === "write")?.status === "ok";
      let html: string;
      if (!readOk && !writeOk) html = "❌ Tu red está bloqueando la base de datos por completo. Casi seguro un bloqueador de anuncios, VPN o el operador. Prueba: apagar VPN/bloqueadores, cambiar de wifi a datos (o al revés), u otro navegador.";
      else if (readOk && !writeOk) html = "❌ Puede leer pero NO escribir. Copia este resultado y envíalo — es justo lo que necesito para arreglarlo.";
      else html = "❌ Falla parcial. Copia el resultado y envíalo a tu equipo.";
      setVerdict({ ok: false, html });
    }
    setEnv(`Navegador: ${navigator.userAgent}`);
    logRef.current.push(`UA: ${navigator.userAgent}`);
  }

  async function run() {
    logRef.current = [];
    setChecks(INITIAL_CHECKS.map((c) => ({ ...c })));
    setVerdict(null);

    // 1) librería / configuración del cliente
    let sb;
    try {
      sb = getSupabase();
      if (!sb) throw new Error("getSupabase() no devolvió un cliente.");
    } catch (e) {
      const finalChecks = [{ ...INITIAL_CHECKS[0], status: "bad" as const, detail: "No se pudo crear el cliente de Supabase: " + String((e as Error).message || e) }, ...INITIAL_CHECKS.slice(1)];
      setChecks(finalChecks);
      finish(finalChecks);
      return;
    }
    setCheck("lib", true, "OK");

    // 2) leer
    try {
      const r = await race(sb.from("profiles").select("id").limit(1), 10000);
      if (r.error) setCheck("read", false, "Error: " + r.error.message);
      else setCheck("read", true, `Leyó ${r.data ? r.data.length : 0} registro(s). OK`);
    } catch (e) {
      setCheck("read", false, String((e as Error).message || e));
    }

    // 3) rpc
    try {
      const r2 = await race(sb.rpc("email_available", { p_email: "diagnostico" + Date.now() + "@test.com" }), 10000);
      if (r2.error) setCheck("rpc", false, "Error: " + r2.error.message);
      else setCheck("rpc", true, `Respondió: ${JSON.stringify(r2.data)}. OK`);
    } catch (e) {
      setCheck("rpc", false, String((e as Error).message || e));
    }

    // 4) escribir (insert temporal + borrar)
    try {
      const testId = "diag_" + Date.now();
      const ins = await race(
        sb.from("profiles").insert({ id: testId, name: "DIAG", nickname: "diag" + Date.now(), position: "DEL", ovr: 1, password_hash: "x" }),
        10000
      );
      if (ins.error) {
        setCheck("write", false, "Error: " + ins.error.message);
      } else {
        setCheck("write", true, "Escribió OK. (borrando prueba...)");
        try {
          await race(sb.from("profiles").delete().eq("id", testId), 8000);
        } catch {
          /* la limpieza es best-effort, igual que en el original */
        }
        setCheck("write", true, "Escribió y limpió OK.");
      }
    } catch (e) {
      setCheck("write", false, String((e as Error).message || e));
    }

    setChecks((prev) => {
      const finalChecks = prev || INITIAL_CHECKS;
      finish(finalChecks);
      return finalChecks;
    });
  }

  function copyAll() {
    const txt = "LEVEL UP · Diagnóstico\n" + logRef.current.join("\n");
    navigator.clipboard.writeText(txt).then(
      () => alert("Copiado. Pégalo en el chat con tu equipo."),
      () => alert(txt)
    );
  }

  return (
    <div className="estado-page">
      <h1>🩺 Estado del sistema · LEVEL UP</h1>
      <div className="sub">Corre esta prueba en el mismo celular/red donde te falla, y mándale la captura a tu equipo.</div>

      <button onClick={run}>▶ PROBAR AHORA</button>

      <div id="results">
        {(checks || []).map((c) => (
          <div className={`card ${c.status === "pending" ? "" : c.status}`} key={c.id}>
            <div className="row">
              <span className="dot"></span>
              <span>{c.label}</span>
            </div>
            <div className="detail">{c.detail}</div>
          </div>
        ))}
      </div>

      {verdict && <div className={`verdict ${verdict.ok ? "v-ok" : "v-bad"}`}>{verdict.html}</div>}
      {verdict && (
        <button className="copy" onClick={copyAll}>
          📋 COPIAR RESULTADO
        </button>
      )}
      <div className="env">{env}</div>
    </div>
  );
}
