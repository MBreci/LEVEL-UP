"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useHasMounted } from "@/hooks/useHasMounted";
import { PartidosTab } from "@/components/admin/estadisticas/PartidosTab";
import { JugadoresTab } from "@/components/admin/estadisticas/JugadoresTab";
import { TorneosTab } from "@/components/admin/estadisticas/TorneosTab";
import type { ShOpenKey } from "@/components/admin/estadisticas/MatchDetailPanel";

/**
 * Orquestador de /admin/estadisticas (Centro de Estadísticas, pieza 4 de Fase
 * 5) — puerto fiel de admin-estadisticas.html + initStatsHubPage. Usa el
 * mismo chrome compartido del sitio (header/nav/footer normales), a
 * diferencia de /admin/partido. `openKey` es el único detalle de partido
 * abierto en toda la página — igual que _shOpenMatchId/_shOpenWrapId en el
 * original, evita que dos paneles (uno en PARTIDOS y otro en TORNEOS) para
 * el mismo partido queden abiertos a la vez.
 */
export function EstadisticasContent() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const hasMounted = useHasMounted();
  const [openKey, setOpenKey] = useState<ShOpenKey | null>(null);

  useEffect(() => {
    if (hasMounted && !isAdmin) router.replace("/dashboard");
  }, [hasMounted, isAdmin, router]);

  function toggleDetail(matchId: string, esEquipo: boolean, wrapId: string) {
    setOpenKey((prev) => (prev && prev.matchId === matchId && prev.wrapId === wrapId ? null : { matchId, esEquipo, wrapId }));
  }

  if (!hasMounted || !isAdmin) return null;

  return (
    <>
      <div className="page-banner">
        <div className="page-banner-title">ESTADÍSTICAS</div>
        <div className="page-banner-desc">
          Cargar el marcador y las estadísticas de cada jugador de los partidos ya jugados, antes y después del partido para todos los modos (temporal mientras no tengamos API directa de VEO).
        </div>
      </div>

      <PartidosTab openKey={openKey} onToggle={toggleDetail} />
      <JugadoresTab />
      <TorneosTab openKey={openKey} onToggle={toggleDetail} />
    </>
  );
}
