import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-orbitron",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LEVEL UP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${orbitron.variable} ${inter.variable}`}>
      <body>
        {/* Debe cargar antes de cualquier hidratación: define window.LS (localStorage
            resiliente con fallback a window.name) y el modo seguro (?safe/?nosafe). */}
        <Script src="/storage-shim.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
