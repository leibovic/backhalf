import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Shell } from "@/components/design/Shell";
import "./globals.css";

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Backhalf — Race Planner",
  description: "Plan your ultra race splits, fuel, and pacing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bebas.variable} ${plexMono.variable} ${plexSans.variable}`}
      style={{ height: "100%" }}
    >
      <body style={{ minHeight: "100%", height: "100%" }}>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
