/**
 * Layout mínimo para las vistas preview aisladas (Fase 6): sin AppHeader,
 * sin ActivityTicker, sin AppFooter, sin AudioPlayer, sin FeedbackWidget, y
 * sin AppProviders/AuthGuard — estas páginas no comparten sesión ni estado
 * con la app autenticada, igual que en el original (no cargan app.js, son
 * mockups de diseño o una herramienta de diagnóstico standalone).
 */
export default function PreviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
