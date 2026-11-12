import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { Overpass } from "next/font/google";
import "./globals.css";

// Overpass is an open-source face derived from Highway Gothic, the lettering on
// North American road signs. Self-hosted at build time by next/font.
const overpass = Overpass({ subsets: ["latin"], display: "swap", variable: "--font-overpass" });

export const metadata: Metadata = {
  title: { default: "Class 7 Ready | Alberta Learner's Test Practice", template: "%s | Class 7 Ready" },
  description: "An independent Alberta Class 7 learner study companion. Practice original questions and track your progress.",
  applicationName: "Class 7 Ready",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#143d52", width: "device-width", initialScale: 1 };

function Brand() {
  return <Link href="/" className="brand" aria-label="Class 7 Ready home"><span className="brand-mark" aria-hidden="true"><span /></span><span>CLASS<span className="brand-seven">7</span><span className="brand-accent">READY</span></span></Link>;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={overpass.variable}><body><div className="site-shell"><header className="site-header"><div className="page-width header-inner"><Brand /><nav aria-label="Main navigation" className="nav-links"><Link href="/">Home</Link><Link href="/practice">Practice</Link><Link href="/signs">Road signs</Link><Link href="/about">About</Link></nav><Link href="/practice" className="header-cta">Start practising <span aria-hidden="true">↗</span></Link></div></header><main>{children}</main><footer className="site-footer"><div className="page-width footer-inner"><div><Brand /><p>Drive prepared. Learn at your own pace.</p></div><div className="footer-note">Independent study tool · Not affiliated with the Government of Alberta.<br/><Link href="/about">About this project</Link></div></div></footer></div><Analytics /></body></html>;
}
