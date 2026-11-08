import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RoadReady 7 | Alberta Class 7 Practice", template: "%s | RoadReady 7" },
  description: "An independent Alberta Class 7 learner study companion. Practice original questions and track your progress.",
  applicationName: "RoadReady 7",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#143d52", width: "device-width", initialScale: 1 };

function Brand() {
  return <Link href="/" className="brand" aria-label="RoadReady 7 home"><span className="brand-mark" aria-hidden="true"><span /></span><span>ROAD<span className="brand-accent">READY</span><span className="brand-seven">7</span></span></Link>;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body><div className="site-shell"><header className="site-header"><div className="page-width header-inner"><Brand /><nav aria-label="Main navigation" className="nav-links"><Link href="/">Home</Link><Link href="/practice">Practice</Link><Link href="/signs">Road signs</Link><Link href="/about">About</Link></nav><Link href="/practice" className="header-cta">Start practising <span aria-hidden="true">↗</span></Link></div></header><main>{children}</main><footer className="site-footer"><div className="page-width footer-inner"><div><Brand /><p>Drive prepared. Learn at your own pace.</p></div><div className="footer-note">Independent study tool · Not affiliated with the Government of Alberta.<br/><Link href="/about">About this project</Link></div></div></footer></div></body></html>;
}
