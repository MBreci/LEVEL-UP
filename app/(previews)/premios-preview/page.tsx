import type { Metadata } from "next";
import "./premios-preview.css";
import { PremiosPreviewContent } from "./PremiosPreviewContent";

export const metadata: Metadata = {
  title: "LEVEL UP · Premios (preview)",
  robots: { index: false, follow: false },
};

export default function PremiosPreviewPage() {
  return <PremiosPreviewContent />;
}
