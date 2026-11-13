import type { Metadata } from "next";
import "./redesign.css";
import { IndexPreviewContent } from "./IndexPreviewContent";

export const metadata: Metadata = {
  title: "LEVEL UP",
  robots: { index: false, follow: false },
};

export default function IndexPreviewPage() {
  return <IndexPreviewContent />;
}
