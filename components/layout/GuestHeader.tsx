"use client";

import Link from "next/link";
import { useAuthModal } from "@/context/AuthModalContext";

export function GuestHeader({ showInicio = false }: { showInicio?: boolean }) {
  const { openAuth } = useAuthModal();
  return (
    <header>
      <div className="nav-top">
        <Link href="/">
          <img className="logo-img" src="/assets/logo.png" alt="LEVEL UP" />
        </Link>
        {showInicio && (
          <nav className="nav-modules">
            <a className="nm-item nm-item-link on" href="#inicio">
              INICIO
            </a>
          </nav>
        )}
        <div className="nav-right">
          <button className="btn-g" onClick={() => openAuth(false)}>
            INICIAR SESIÓN
          </button>
          <button className="btn-p" onClick={() => openAuth(true)}>
            CREAR PERFIL
          </button>
        </div>
      </div>
    </header>
  );
}
