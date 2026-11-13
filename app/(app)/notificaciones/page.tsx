import { NotificationsList } from "@/components/notifications/NotificationsList";

export default function NotificacionesPage() {
  return (
    <>
      <div className="page-banner">
        <div className="page-banner-eyebrow">ACTIVIDAD</div>
        <div className="page-banner-title">NOTIFICACIONES</div>
        <div className="page-banner-desc">Actualizaciones de tu carta e invitaciones a partidos de otros jugadores.</div>
      </div>
      <section id="notificaciones">
        <div className="notif-list" id="notif-list">
          <NotificationsList />
        </div>
      </section>
    </>
  );
}
