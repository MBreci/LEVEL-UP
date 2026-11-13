"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { WelcomeHero } from "@/components/dashboard/WelcomeHero";
import { ActionGrid } from "@/components/dashboard/ActionGrid";
import { FlowSnake } from "@/components/dashboard/FlowSnake";
import { RankTrack } from "@/components/dashboard/RankTrack";
import { SoonGrid } from "@/components/dashboard/SoonGrid";
import { DashboardProgress } from "@/components/dashboard/DashboardProgress";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <WelcomeHero />

      <section id="hw-que-es">
        <div className="sec-hdr">
          <div className="sec-eyebrow">EL CONCEPTO</div>
          <div className="page-banner-title hw-sec-title">¿QUÉ ES LEVEL UP?</div>
        </div>
        <div className="hw-pillars">
          <div className="hw-pillar">
            <div className="hw-pillar-icon">⚽</div>
            <div className="hw-pillar-title">FÚTBOL AMATEUR</div>
            <div className="hw-pillar-text">Convertimos el fútbol amateur en una experiencia de progresión similar a un videojuego.</div>
          </div>
          <div className="hw-pillar">
            <div className="hw-pillar-icon">📈</div>
            <div className="hw-pillar-title">CRECIMIENTO REAL</div>
            <div className="hw-pillar-text">Cada partido que juegas influye en tu crecimiento. Cada actuación modifica tu carta.</div>
          </div>
          <div className="hw-pillar">
            <div className="hw-pillar-icon">🏆</div>
            <div className="hw-pillar-title">TU HISTORIA</div>
            <div className="hw-pillar-text">Cada temporada construye tu historia. Aquí no solo juegas fútbol. Construyes una carrera deportiva.</div>
          </div>
        </div>
      </section>

      <section id="hw-acciones">
        <div className="sec-hdr">
          <div className="sec-eyebrow">TU PLATAFORMA</div>
          <div className="page-banner-title hw-sec-title">¿QUÉ PUEDES HACER HOY?</div>
        </div>
        <ActionGrid />
      </section>

      <section id="hw-como-funciona">
        <div className="sec-hdr">
          <div className="sec-eyebrow">EL CICLO</div>
          <div className="page-banner-title hw-sec-title">¿CÓMO FUNCIONA LEVEL UP?</div>
        </div>
        <FlowSnake />
      </section>

      <section id="hw-modos">
        <div className="sec-hdr">
          <div className="sec-eyebrow">LOS DOS MODOS</div>
          <div className="page-banner-title hw-sec-title">¿CÓMO SE JUEGA EN LEVEL UP?</div>
          <div className="sec-desc">Hay dos formas de jugar. Cada una tiene su propósito.</div>
        </div>
        <div className="hw-modos-grid">
          <div className="hw-modo-card hw-modo-libre">
            <div className="hw-modo-icon">⚽</div>
            <div className="hw-modo-tag">MODO LIBRE</div>
            <div className="hw-modo-title">PARTIDOS LIBRES</div>
            <div className="hw-modo-desc">
              Organiza o únete a partidos en cualquier cancha. Filtra por zona, horario y modalidad. Sin restricciones
              de cancha ni registro oficial de estadísticas.
            </div>
            <ul className="hw-modo-list">
              <li>Cualquier cancha disponible</li>
              <li>Tú organizas o te unes</li>
              <li>Sin toma de medidas oficial</li>
              <li>Ideal para calentar y practicar</li>
            </ul>
            <Link className="hw-modo-btn hw-modo-btn-libre" href="/buscar-partido">
              IR A PARTIDOS
            </Link>
          </div>
          <div className="hw-modo-card hw-modo-rey">
            <div className="hw-modo-glow"></div>
            <div className="hw-modo-icon">👑</div>
            <div className="hw-modo-tag">MODO COMPETITIVO</div>
            <div className="hw-modo-title">REY DEL BARRIO</div>
            <div className="hw-modo-desc">
              El modo oficial de LEVEL UP. Solo en canchas certificadas donde el equipo toma las medidas en tiempo
              real. Cada partido afecta directamente tu ficha, tu OVR y tu rango.
            </div>
            <ul className="hw-modo-list">
              <li>Canchas certificadas LEVEL UP</li>
              <li>Medición oficial en cancha</li>
              <li>Actualiza tu OVR y estadísticas</li>
              <li>Sube o baja de rango</li>
            </ul>
            <Link className="hw-modo-btn hw-modo-btn-rey" href="/equipos?tab=rey">
              RETAR EQUIPO
            </Link>
          </div>
        </div>
      </section>

      <section id="hw-rangos">
        <div className="sec-hdr">
          <div className="sec-eyebrow">PROGRESIÓN</div>
          <div className="page-banner-title hw-sec-title">SISTEMA DE RANGOS</div>
          <div className="sec-desc">Cada rango representa un escalón en tu evolución como futbolista dentro de LEVEL UP.</div>
        </div>
        <RankTrack />
      </section>

      <section id="hw-subir-rango">
        <div className="sec-hdr">
          <div className="sec-eyebrow">TU RENDIMIENTO</div>
          <div className="page-banner-title hw-sec-title">¿CÓMO SUBO DE RANGO?</div>
          <div className="sec-desc">
            No subes únicamente por ganar. Tampoco bajas únicamente por perder. LEVEL UP premia la constancia, no un
            solo partido.
          </div>
        </div>
        <div className="hw-checklist">
          <div className="hw-check-item">✔ Juegas partidos</div>
          <div className="hw-check-item">✔ Mantienes buen rendimiento</div>
          <div className="hw-check-item">✔ Consigues MVP</div>
          <div className="hw-check-item">✔ Ayudas a tu equipo</div>
          <div className="hw-check-item">✔ Mejoras tus estadísticas</div>
          <div className="hw-check-item">✔ Eres constante</div>
          <div className="hw-check-item">✔ Mantienes buena asistencia</div>
          <div className="hw-check-item">✔ Respetas las reglas</div>
        </div>
      </section>

      <section id="dashboard">
        <div className="sec-hdr">
          <div className="sec-eyebrow">TU CENTRO DE MANDO</div>
          <div className="page-banner-title hw-sec-title">TU PROGRESO HOY</div>
          <div className="sec-desc">Tu progreso, tu próximo partido y tu ranking, en un solo lugar.</div>
        </div>
        <DashboardProgress />
      </section>

      <section id="hw-proximamente">
        <div className="sec-hdr">
          <div className="sec-eyebrow">EL FUTURO</div>
          <div className="page-banner-title hw-sec-title">PRÓXIMAMENTE</div>
        </div>
        <SoonGrid />
      </section>

      <section id="hw-final">
        <div className="hw-final-card">
          <div className="hw-final-text">
            No importa dónde juegues.
            <br />
            No importa quién seas hoy.
            <br />
            Cada partido puede cambiar tu historia.
            <br />
            <strong>Bienvenido a LEVEL UP.</strong>
          </div>
          <button className="hw-cta-main" onClick={() => router.push("/buscar-partido")}>
            JUGAR MI PRIMER PARTIDO
          </button>
        </div>
      </section>
    </>
  );
}
