import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import { Outfit } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en" className={`dark ${pressStart2P.variable} ${outfit.variable} ${geistMono.variable}`}>
      <body>
        <Sidebar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
