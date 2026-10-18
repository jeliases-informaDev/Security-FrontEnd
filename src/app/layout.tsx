import type { Metadata, Viewport } from "next";
// Tipografia propia del sitio (sin pedir nada a Google en cada visita): IBM Plex Sans para el texto y Plex Mono para cifras y codigos.
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./globals.css";
import { MARCA } from "@/shared/lib/marca";

// Metadatos de seguridad básicos para evitar indexaciones no deseadas si el entorno no es prod
export const metadata: Metadata = {
  title: { default: `${MARCA.nombre} · ${MARCA.producto}`, template: `%s · ${MARCA.nombre}` },
  description: "Plataforma de cumplimiento para la prevención del lavado de activos y del financiamiento del terrorismo.",
  robots: "noindex, nofollow", // Cambiaremos esto cuando vayamos a producción pública
};

export const viewport: Viewport = { themeColor: "#f4f6fa", width: "device-width", initialScale: 1 };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
