import type { Metadata } from "next";
// Tipografia propia del sitio (sin pedir nada a Google en cada visita): IBM Plex Sans para el texto y Plex Mono para cifras y codigos.
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./globals.css";

// Metadatos de seguridad básicos para evitar indexaciones no deseadas si el entorno no es prod
export const metadata: Metadata = {
  title: "Plataforma RegTech Core",
  description: "Sistema de Prevención de Riesgos, Cumplimiento y Lavado de Activos.",
  robots: "noindex, nofollow", // Cambiaremos esto cuando vayamos a producción pública
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}