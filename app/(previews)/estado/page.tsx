import type { Metadata } from "next";
import { EstadoContent } from "./EstadoContent";

export const metadata: Metadata = {
  title: "Estado del sistema · LEVEL UP",
  robots: { index: false, follow: false },
};

export default function EstadoPage() {
  return <EstadoContent />;
}
