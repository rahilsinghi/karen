import type { Metadata } from "next";
import { Silkscreen, VT323 } from "next/font/google";
import "./globals.css";

const silkscreen = Silkscreen({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const vt323 = VT323({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Karen — Automated Correspondence Systems LLC",
  description: "Karen gets results.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${silkscreen.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-bg text-text">
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border px-6 py-4 text-center font-mono text-xs text-muted">
          <p>Karen is always watching. Karen means well.</p>
          <p className="mt-1">
            &copy; Karen Automated Correspondence Systems LLC — All rights
            reserved. All matters documented. All debts remembered.
          </p>
        </footer>
      </body>
    </html>
  );
}
