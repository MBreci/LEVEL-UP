import type { Metadata } from "next";
import "./torneo-preview.css";
import { TorneoPreviewContent } from "./TorneoPreviewContent";

export const metadata: Metadata = {
  title: "LEVEL UP · Torneo de Apertura (Preview)",
  robots: { index: false, follow: false },
};

export default function TorneoPreviewPage() {
  return <TorneoPreviewContent />;
}
