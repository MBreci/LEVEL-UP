import { AppProviders } from "@/context/AppProviders";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppHeader } from "@/components/layout/AppHeader";
import { ActivityTicker } from "@/components/layout/ActivityTicker";
import { AppFooter } from "@/components/layout/AppFooter";
import { AudioPlayer } from "@/components/layout/AudioPlayer";
import { PlayerViewProvider } from "@/context/PlayerViewContext";
import { RateModalProvider } from "@/context/RateModalContext";
import { WipModalProvider } from "@/context/WipModalContext";
import { TeamsProvider } from "@/context/TeamsContext";
import { MatchInvitesProvider } from "@/context/MatchInvitesContext";
import { TournamentsProvider } from "@/context/TournamentsContext";
import { PlayerViewModal } from "@/components/modals/PlayerViewModal";
import { RateModal } from "@/components/modals/RateModal";
import { WipModal } from "@/components/modals/WipModal";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AuthGuard>
        <TeamsProvider>
          <MatchInvitesProvider>
            <TournamentsProvider>
              <PlayerViewProvider>
                <RateModalProvider>
                  <WipModalProvider>
                    <AppHeader />
                    <ActivityTicker />
                    {children}
                    <AppFooter />
                    <AudioPlayer />
                    <PlayerViewModal />
                    <RateModal />
                    <WipModal />
                    <FeedbackWidget />
                  </WipModalProvider>
                </RateModalProvider>
              </PlayerViewProvider>
            </TournamentsProvider>
          </MatchInvitesProvider>
        </TeamsProvider>
      </AuthGuard>
    </AppProviders>
  );
}
