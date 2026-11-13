import Link from "next/link";
import { HW_ACTIONS } from "@/lib/domain/dashboardContent";

export function ActionGrid() {
  return (
    <div className="hw-action-grid" id="hw-action-grid">
      {HW_ACTIONS.map((a) => (
        <div className="hw-action-card" key={a.title}>
          <div className="hw-action-icon">{a.icon}</div>
          <div className="hw-action-title">{a.title}</div>
          <div className="hw-action-text">{a.text}</div>
          <Link className="hw-action-btn" href={a.href}>
            {a.btn}
          </Link>
        </div>
      ))}
    </div>
  );
}
