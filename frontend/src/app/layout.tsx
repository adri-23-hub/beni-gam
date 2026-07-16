import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beni-Gan — Sistema de Trazabilidad Cárnica",
  description: "Plataforma de gestión de inventario cárnico con método PEPS para la Central de Acopio San Borja, Beni",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
