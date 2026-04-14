import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import { Providers } from "./providers";
import OfflineBanner from "@/components/OfflineBanner";
import "./globals.css";

/* Plus Jakarta Sans — headlines, labels, buttons (the "Accra street energy" voice) */
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

/* Newsreader — narrative body text (the "scholarly" voice) */
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HatchQuest",
  description: "Build your empire in Accra. Make bold decisions. Prove your entrepreneurial acumen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${newsreader.variable}`}>
      <head>
        {/* Material Symbols Outlined — used for icons throughout the Stitch design */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <OfflineBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
