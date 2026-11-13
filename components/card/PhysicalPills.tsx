import type { PlayerPhysical } from "@/types/profile";

function Pill({ cls, label, val, unit }: { cls: string; label: string; val: number | string | null | undefined; unit?: string }) {
  const empty = val == null;
  return (
    <div className={`fc-phys-pill ${cls}${empty ? " empty" : ""}`} title={label}>
      <span className="fc-phys-l">{label}</span>
      <span className="fc-phys-v">{empty ? "—" : `${val}${unit || ""}`}</span>
    </div>
  );
}

export function PhysicalPills({ physical }: { physical: PlayerPhysical | undefined }) {
  const ph = physical || ({} as PlayerPhysical);
  return (
    <div className="fc-phys-row">
      <Pill cls="cyan" label="PESO" val={ph.weight} unit="KG" />
      <Pill cls="pink" label="ALT" val={ph.height} unit="CM" />
      <Pill cls="orange" label="EDAD" val={ph.age} />
      <Pill cls="violet" label="PIE" val={ph.foot} />
    </div>
  );
}
