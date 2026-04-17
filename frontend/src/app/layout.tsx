import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { Providers } from "./providers";
import OfflineBanner from "@/components/OfflineBanner";
import "./globals.css";

/* Fredoka — playful headlines, buttons */
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* Nunito — clean, rounded body text */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
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
