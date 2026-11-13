import { HW_SOON } from "@/lib/domain/dashboardContent";

export function SoonGrid() {
  return (
    <div className="hw-soon-grid" id="hw-soon-grid">
      {HW_SOON.map((s) => (
        <div className="hw-soon-tile" key={s.name}>
          <div className="hw-soon-icon">{s.icon}</div>
          <div className="hw-soon-name">{s.name}</div>
        </div>
      ))}
    </div>
  );
}
