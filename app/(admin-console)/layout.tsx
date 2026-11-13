import { AppProviders } from "@/context/AppProviders";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { TeamsProvider } from "@/context/TeamsContext";

/**
 * Layout aislado para /admin/partido: a diferencia de (app)/layout.tsx, NO
 * renderiza AppHeader/ActivityTicker/AppFooter/AudioPlayer — admin-partido.html
 * en el original es una página completamente aislada, sin la navegación del
 * sitio, con su propio diseño visual (ver admin-partido.css). Solo se
 * conservan los providers de datos que la consola realmente necesita
 * (perfil/auth, equipos/partidos de equipo).
 */
export default function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AuthGuard>
        <TeamsProvider>{children}</TeamsProvider>
      </AuthGuard>
    </AppProviders>
  );
}
