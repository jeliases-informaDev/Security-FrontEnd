import type { Metadata } from "next";
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