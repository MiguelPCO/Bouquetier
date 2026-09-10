import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { fraunces, plexSans, plexMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Next needs an absolute base to resolve the relative `openGraph.images` paths
  // (`/api/og?s=...`, `/og-fallback.png`) into the absolute URLs social platforms require.
  // Without it Next falls back to localhost (or VERCEL_URL), which is wrong for a canonical
  // domain and breaks entirely off-Vercel. No production domain is settled yet, so this
  // reads an env var and degrades to localhost for local dev.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Bouquetier",
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
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
