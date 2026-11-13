import type { Metadata } from "next";
import "./wallet-preview.css";
import { WalletPreviewContent } from "./WalletPreviewContent";

export const metadata: Metadata = {
  title: "LEVEL UP · Level Coins (preview)",
  robots: { index: false, follow: false },
};

export default function WalletPreviewPage() {
  return <WalletPreviewContent />;
}
