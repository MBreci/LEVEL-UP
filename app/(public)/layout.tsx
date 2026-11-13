import { AppProviders } from "@/context/AppProviders";
import { AppFooter } from "@/components/layout/AppFooter";
import { AudioPlayer } from "@/components/layout/AudioPlayer";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      {children}
      <AppFooter />
      <AudioPlayer />
      <FeedbackWidget />
    </AppProviders>
  );
}
