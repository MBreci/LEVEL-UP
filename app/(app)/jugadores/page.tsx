import { PlayerSearchGrid } from "@/components/players/PlayerSearchGrid";

export default function JugadoresPage() {
  return (
    <>
      <div className="page-banner">
        <div className="page-banner-eyebrow">COMUNIDAD</div>
        <div className="page-banner-title">JUGADORES</div>
        <div className="page-banner-desc">Busca a otros jugadores de LEVEL UP y revisa su ficha.</div>
      </div>
      <PlayerSearchGrid />
    </>
  );
}
