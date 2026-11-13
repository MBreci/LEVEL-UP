"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTeams } from "@/context/TeamsContext";
import { useMatchInvites } from "@/context/MatchInvitesContext";
import { FUNCTIONAL_MODULES, PAGE_ROUTES } from "@/lib/domain/rank";
import { coinsFmt } from "@/lib/domain/wallet";
import { useClickOutside } from "@/hooks/useClickOutside";
import { MobileJugarShortcut, MobileNavTrigger } from "@/components/layout/MobileNav";
import { AdminPanelModal } from "@/components/admin/AdminPanelModal";

type DropdownId = "account" | "jugar" | "admin" | "previews" | null;

const PREVIEW_LINKS: { href: string; label: string }[] = [
  { href: "/index-preview", label: "🏠 LANDING · REDISEÑO" },
  { href: "/index-v4", label: "🏠 LANDING · V4" },
  { href: "/premios-preview", label: "🎁 PREMIOS · PREVIEW" },
  { href: "/torneo-preview", label: "🏆 TORNEO · PREVIEW" },
  { href: "/wallet-preview", label: "🪙 BILLETERA · PREVIEW" },
  { href: "/estado", label: "🩺 DIAGNÓSTICO SUPABASE" },
];

export function AppHeader() {
  const { profile, isAdmin, logout } = useAuth();
  const { myTeamInvites, myChallenges, myLeaveRequests } = useTeams();
  const { myInvites } = useMatchInvites();
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef, () => setOpenDropdown(null));

  const totalCount = profile
    ? profile.notifications.length +
      myInvites.filter((i) => i.status === "pendiente").length +
      myTeamInvites.length +
      myChallenges.length +
      myLeaveRequests.length
    : 0;
  const notifCount = profile ? Math.max(0, totalCount - (profile.notifSeenCount || 0)) : 0;

  function handleLogout() {
    setOpenDropdown(null);
    logout();
    router.push("/");
  }

  return (
    <>
      <header>
        <div className="nav-top">
          <MobileNavTrigger onOpenAdminPanel={() => setAdminPanelOpen(true)} />
          <Link href={profile ? "/dashboard" : "/"}>
            <img className="logo-img" src="/assets/logo.png" alt="LEVEL UP" />
          </Link>
          <nav className="nav-modules" id="nav-modules">
            {FUNCTIONAL_MODULES.map((m) => {
              const href = PAGE_ROUTES[m.id] || "#";
              const on = href.split("?")[0] === pathname;
              return (
                <Link key={m.id} className={`nm-item nm-item-link${on ? " on" : ""}`} href={href}>
                  {m.label}
                </Link>
              );
            })}
          </nav>
          <div className="nav-right" ref={wrapRef}>
            {isAdmin && (
              <div className="dropdown-wrap">
                <button className="nm-admin-pill" onClick={() => setOpenDropdown((d) => (d === "admin" ? null : "admin"))}>
                  ⚙ ADMIN ▾
                </button>
                <div className={`dropdown-menu${openDropdown === "admin" ? " open" : ""}`}>
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      setOpenDropdown(null);
                      setAdminPanelOpen(true);
                    }}
                  >
                    ⚙ PANEL ADMIN
                  </div>
                  <Link className="dropdown-item" href="/admin/estadisticas" onClick={() => setOpenDropdown(null)}>
                    📊 ESTADÍSTICAS
                  </Link>
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="dropdown-wrap">
                <button className="nm-admin-pill" onClick={() => setOpenDropdown((d) => (d === "previews" ? null : "previews"))}>
                  🎬 PREVIEWS ▾
                </button>
                <div className={`dropdown-menu${openDropdown === "previews" ? " open" : ""}`}>
                  {PREVIEW_LINKS.map((p) => (
                    <Link className="dropdown-item" href={p.href} key={p.href} onClick={() => setOpenDropdown(null)}>
                      {p.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <MobileJugarShortcut />
            <Link className="season-badge" href="/temporada-piloto" title="Conoce la Temporada Beta">
              TEMPORADA BETA
            </Link>
            <Link className="btn-g" href="/notificaciones">
              🔔 <span id="notif-count">{notifCount}</span>
            </Link>
            <div className="dropdown-wrap">
              <button className="btn-g" onClick={() => setOpenDropdown((d) => (d === "account" ? null : "account"))}>
                {(profile?.nickname || profile?.name || "").split(" ")[0]}
              </button>
              <div className={`dropdown-menu${openDropdown === "account" ? " open" : ""}`}>
                {profile && (
                  <a className="dropdown-item wallet-dropdown-item" href="/saldo">
                    <span className="wallet-dot"></span> 🪙 <strong>{coinsFmt(profile.saldo)} COINS</strong>
                  </a>
                )}
                <Link className="dropdown-item" href="/dashboard" onClick={() => setOpenDropdown(null)}>
                  CENTRO DE MANDO
                </Link>
                <Link className="dropdown-item" href="/carta" onClick={() => setOpenDropdown(null)}>
                  PERFIL
                </Link>
                <Link className="dropdown-item" href="/configuracion" onClick={() => setOpenDropdown(null)}>
                  CONFIGURACIÓN
                </Link>
                <div className="dropdown-item danger" onClick={handleLogout}>
                  CERRAR SESIÓN
                </div>
              </div>
            </div>
            <div className="dropdown-wrap">
              <button className="btn-p" onClick={() => setOpenDropdown((d) => (d === "jugar" ? null : "jugar"))}>
                JUGAR PARTIDO ▾
              </button>
              <div className={`dropdown-menu${openDropdown === "jugar" ? " open" : ""}`}>
                <Link className="dropdown-item" href="/buscar-partido" onClick={() => setOpenDropdown(null)}>
                  CREAR PARTIDO — MODO LIBRE
                  <span className="dropdown-item-sub">Crea o únete a un partido en modo libre</span>
                </Link>
                <Link className="dropdown-item" href="/equipos?tab=crear" onClick={() => setOpenDropdown(null)}>
                  CREAR EQUIPO / MI EQUIPO
                  <span className="dropdown-item-sub">Crea o gestiona tu equipo</span>
                </Link>
                <Link className="dropdown-item" href="/equipos?tab=rey" onClick={() => setOpenDropdown(null)}>
                  REY DEL BARRIO
                  <span className="dropdown-item-sub">Busca y reta a otros equipos</span>
                </Link>
                <Link className="dropdown-item" href="/equipos?tab=programados" onClick={() => setOpenDropdown(null)}>
                  PARTIDOS PROGRAMADOS
                  <span className="dropdown-item-sub">Ve tus retos y partidos</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      {isAdmin && adminPanelOpen && <AdminPanelModal onClose={() => setAdminPanelOpen(false)} />}
    </>
  );
}
