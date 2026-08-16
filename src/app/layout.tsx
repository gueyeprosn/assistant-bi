import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const source = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Assistant Bi — Secrétaire IA WhatsApp pour professionnels",
  description:
    "Le bot répond 24h/24 en français et wolof, prend les rendez-vous et rappelle les clients la veille. Tout se passe sur WhatsApp.",
  icons: {
    icon: "/brand/icon.png",
    apple: "/brand/icon.png",
  },
  openGraph: {
    title: "Assistant Bi",
    description: "Secrétaire WhatsApp en français et wolof, pour tous les professionnels.",
    locale: "fr",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2B48",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${source.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
