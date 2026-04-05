import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MiamWeek",
  description:
    "Planificateur de courses intelligent - liste, recettes, suivi des prix et consommation",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-background">
        <Nav />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-6 pb-20 md:pt-4 md:pb-4 min-h-0">
          {children}
        </main>
      </body>
    </html>
  );
}
