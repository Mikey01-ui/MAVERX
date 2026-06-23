import type { Metadata } from "next";
import { DM_Sans, Share_Tech_Mono, Space_Grotesk } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";
import "./mission-intro.css";
import "./videointro.css";
import "./debrief-game.css";
import "./m1-game.css";
import "./m1-tutorial.css";
import "./m2-game.css";
import "./m2-tutorial.css";
import "./m3-game.css";
import "./m3-tutorial.css";
import "./m4-game.css";
import "./m4-tutorial.css";
import "./m5-game.css";
import "./m5-tutorial.css";
import "./finale.css";
import "@/components/admin/playtest-mission-nav.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Operation OMNI — The Data Heist",
  description: "Narrative data-literacy escape room — Mastermind terminal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} ${shareTechMono.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ fontFamily: "var(--font-body)" }}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
