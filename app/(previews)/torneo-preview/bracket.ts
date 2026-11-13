/** Lógica standalone de sorteo/bracket de torneo-preview.html, portada tal cual (sin conexión real a datos). */
export interface PreviewTeam {
  name: string;
  color: string;
  ini: string;
}

export interface PreviewMatch {
  a: PreviewTeam | null;
  b: PreviewTeam | null;
  sa: number | null;
  sb: number | null;
  w: "a" | "b" | null;
}

export const COLORS = ["#00ff88", "#ff00aa", "#ff6600", "#3aa0ff", "#ffd24d", "#a97bff", "#ff4d4d", "#2ee6c8"];
export const BASE_TEAMS = ["LOS TIGRES", "BARRIO FC", "DEPORTIVO SUR", "LA JAURÍA", "REAL NORTE", "FURIA", "LOS PIBES", "ATLÉTICO"];

export function makeTeam(name: string, i: number): PreviewTeam {
  const ini = name.replace(/[^A-ZÁ]/g, "").slice(0, 2) || name.slice(0, 2).toUpperCase();
  return { name, color: COLORS[i % COLORS.length], ini };
}

export function shuffleTeams(teams: PreviewTeam[]): PreviewTeam[] {
  return [...teams].sort(() => Math.random() - 0.5);
}

const ROUND_LABELS = ["CUARTOS", "SEMIFINAL", "FINAL"];
export { ROUND_LABELS };

export function buildBracket(teams: PreviewTeam[]): PreviewMatch[][] {
  const r0: PreviewMatch[] = [];
  for (let i = 0; i < 8; i += 2) {
    r0.push({ a: teams[i], b: teams[i + 1], sa: null, sb: null, w: null });
  }
  const r1: PreviewMatch[] = [
    { a: null, b: null, sa: null, sb: null, w: null },
    { a: null, b: null, sa: null, sb: null, w: null },
  ];
  const r2: PreviewMatch[] = [{ a: null, b: null, sa: null, sb: null, w: null }];
  return [r0, r1, r2];
}

/** Avanza el siguiente partido listo sin decidir; devuelve el nuevo estado de rounds + el campeón si se acaba de definir. */
export function advanceResult(rounds: PreviewMatch[][]): { rounds: PreviewMatch[][]; championName: string | null } {
  const next = rounds.map((r) => r.map((m) => ({ ...m })));
  for (let ri = 0; ri < next.length; ri++) {
    for (let mi = 0; mi < next[ri].length; mi++) {
      const m = next[ri][mi];
      if (m.w) continue;
      if (!m.a || !m.b) continue;
      let sa = Math.floor(Math.random() * 4);
      const sb = Math.floor(Math.random() * 4);
      if (sa === sb) sa++;
      const w: "a" | "b" = sa > sb ? "a" : "b";
      m.sa = sa;
      m.sb = sb;
      m.w = w;
      const winner = w === "a" ? m.a : m.b;
      if (ri < 2) {
        const nm = next[ri + 1][Math.floor(mi / 2)];
        if (mi % 2 === 0) nm.a = winner;
        else nm.b = winner;
      } else {
        return { rounds: next, championName: winner.name };
      }
      return { rounds: next, championName: null };
    }
  }
  return { rounds: next, championName: null };
}
