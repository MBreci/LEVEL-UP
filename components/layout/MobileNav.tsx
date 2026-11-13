"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FUNCTIONAL_MODULES, PAGE_ROUTES } from "@/lib/domain/rank";

const PREVIEW_LINKS: { href: string; label: string }[] = [
  { href: "/index-preview", label: "🏠 LANDING · REDISEÑO" },
  { href: "/index-v4", label: "🏠 LANDING · V4" },
  { href: "/premios-preview", label: "🎁 PREMIOS · PREVIEW" },
  { href: "/torneo-preview", label: "🏆 TORNEO · PREVIEW" },
  { href: "/wallet-preview", label: "🪙 BILLETERA · PREVIEW" },
  { href: "/estado", label: "🩺 DIAGNÓSTICO SUPABASE" },
];

export function MobileNavTrigger({ onOpenAdminPanel }: { onOpenAdminPanel?: () => void }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, logout } = useAuth();

  return (
    <>
      <button className="nav-hamburger" aria-label="Menú" onClick={() => setOpen(true)}>
        <span></span>
        <span></span>
        <span></span>
      </button>
      {open && (
        <div className="mobile-nav-panel open" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="mnav-card">
            <div className="mnav-head">
              MENÚ
              <button className="mnav-x" onClick={() => setOpen(false)}>✕</button>
            </div>
            {FUNCTIONAL_MODULES.map((m) => {
              const href = PAGE_ROUTES[m.id] || "#";
              const on = href.split("?")[0] === pathname;
              return (
                <Link key={m.id} className={`mnav-item${on ? " on" : ""}`} href={href} onClick={() => setOpen(false)}>
                  {m.label}
                </Link>
              );
            })}
            {isAdmin && (
              <>
                <button
                  className="mnav-item mnav-admin"
                  onClick={() => {
                    setOpen(false);
                    onOpenAdminPanel?.();
                  }}
                >
                  ⚙ ADMIN
                </button>
                <Link className="mnav-item mnav-admin" href="/admin/estadisticas" onClick={() => setOpen(false)}>
                  📊 ESTADÍSTICAS
                </Link>
                <div className="mnav-section-lbl">VISTAS PREVIEW</div>
                {PREVIEW_LINKS.map((p) => (
                  <Link className="mnav-item mnav-admin" href={p.href} key={p.href} onClick={() => setOpen(false)}>
                    {p.label}
                  </Link>
                ))}
              </>
            )}
            <div className="mnav-div"></div>
            <Link className="mnav-item" href="/buscar-partido" onClick={() => setOpen(false)}>⚽ JUGAR PARTIDO</Link>
            <Link className="mnav-item" href="/equipos?tab=crear" onClick={() => setOpen(false)}>🛡️ MI EQUIPO</Link>
            <div className="mnav-div"></div>
            <Link className="mnav-item" href="/carta" onClick={() => setOpen(false)}>PERFIL</Link>
            <Link className="mnav-item" href="/configuracion" onClick={() => setOpen(false)}>CONFIGURACIÓN</Link>
            <button className="mnav-item mnav-danger" onClick={() => { setOpen(false); logout(); router.push("/"); }}>CERRAR SESIÓN</button>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileJugarShortcut() {
  return (
    <Link id="nav-jugar-mobile" className="nav-jugar-mobile" href="/buscar-partido">
      JUGAR
    </Link>
  );
}
