import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { NavLinks } from "./nav-links";
import { NavAuth } from "./nav-auth";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Resource Reservation System",
  description: "Centralized scheduling for shared organizational resources.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <header className="topbar">
            <div className="topbar-inner">
              <Link href="/" className="brand-group">
                <span className="brand">Resource Desk</span>
                <span className="brand-sub">reservation system</span>
              </Link>
              <nav>
                <NavLinks />
                <NavAuth />
              </nav>
            </div>
          </header>
          <div className="shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
