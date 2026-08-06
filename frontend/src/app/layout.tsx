import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-plex-sans",   // mbaj emrin e variablës që s'ndryshon globals.css
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartFleet AI",
  description: "Menaxhim i flotës së dronëve civilë",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sq"
      suppressHydrationWarning
className={`${archivo.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}