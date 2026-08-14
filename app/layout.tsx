import type { Metadata, Viewport } from "next";
import { fraunces, plexSans, plexMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tallo",
  description: "Compón un ramo y obtén la lista de la compra y el diagrama de montaje.",
};

export const viewport: Viewport = {
  themeColor: "#EDECE6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
