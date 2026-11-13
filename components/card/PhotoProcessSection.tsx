import type { Profile } from "@/types/profile";

export function PhotoProcessSection({ profile }: { profile: Profile }) {
  const hasReal = !!profile.photoFull;
  return (
    <div className={`photo-process${hasReal ? " has-real-photo" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="photo-process-img"
        src={hasReal ? profile.photoFull! : "/assets/player-photo.png"}
        alt={hasReal ? `Foto de ${profile.nickname || profile.name}` : "Ejemplo de foto de jugador"}
      />
      <div className="photo-process-text">
        <div className="photo-process-tag">{hasReal ? "FOTO OFICIAL" : "CÓMO FUNCIONA TU FOTO"}</div>
        <div className="photo-process-title">
          {hasReal ? profile.nickname || profile.name : "Así se verá tu carta con tu foto real"}
        </div>
        <p>
          {hasReal
            ? "Tu fotografía oficial de LEVEL UP, tomada en la cancha."
            : "Esta imagen es solo un ejemplo de cómo luce el proceso. Mientras creas tu perfil, tu carta no tiene foto: el equipo de LEVEL UP te toma la fotografía oficial en tu primer partido en la cancha y la sube directamente a tu carta."}
        </p>
      </div>
    </div>
  );
}
