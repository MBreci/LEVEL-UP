import type { PlayerPhysical } from "@/types/profile";

function Box({ label, val, unit }: { label: string; val: number | string | null | undefined; unit?: string }) {
  const pending = val == null;
  return (
    <div className={`phys-box${pending ? " pending" : ""}`}>
      <div className="phys-l">{label}</div>
      <div className="phys-v">{pending ? "PENDIENTE" : `${val}${unit || ""}`}</div>
    </div>
  );
}

export function PhysicalGrid({ physical }: { physical: PlayerPhysical | undefined }) {
  const ph = physical || ({} as PlayerPhysical);
  return (
    <div className="phys-grid">
      <Box label="PESO" val={ph.weight} unit=" kg" />
      <Box label="ALTURA" val={ph.height} unit=" cm" />
      <Box label="EDAD" val={ph.age} unit=" años" />
      <Box label="PIE" val={ph.foot} />
    </div>
  );
}
