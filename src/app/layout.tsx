import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const source = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Assistant Bi — Secrétaire IA WhatsApp pour professionnels sénégalais",
  description:
    "Le bot répond 24h/24 en français et wolof, prend les rendez-vous et rappelle les clients la veille. Tout se passe sur WhatsApp.",
  icons: {
    icon: "/brand/icon.png",
    apple: "/brand/icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${source.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
