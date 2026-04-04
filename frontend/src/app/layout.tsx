import type { Metadata } from "next";
import { Silkscreen, VT323 } from "next/font/google";
import "./globals.css";

const silkscreen = Silkscreen({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const vt323 = VT323({
  variable: "--font-body",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "KAREN — Automated Correspondence Systems LLC",
  description: "A cursed grievance fortress for theatrical escalation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${silkscreen.variable} ${vt323.variable}`}>
      <body>{children}</body>
    </html>
  );
}
