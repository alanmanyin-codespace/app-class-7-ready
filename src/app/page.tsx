import Link from "next/link";
import { DashboardProgress } from "@/components/dashboard-progress";

const benefits = [
  { icon: "◎", title: "Learn the essentials", text: "Build confidence with clear explanations and source links." },
  { icon: "◷", title: "Practice your way", text: "Start with a 10-question introduction. Bigger exam modes are coming." },
  { icon: "↗", title: "See your progress", text: "Your completed starter quizzes stay in this browser." },
];

export default function Home() {
  return <>
    <section className="hero"><div className="page-width hero-grid"><div className="hero-copy">
      <span className="eyebrow"><span className="dot" /> MADE FOR ALBERTA LEARNERS</span>
      <h1>Every great drive<br/>starts with <em>confidence.</em></h1>
      <p className="hero-desc">Your friendly practice space for the Alberta Class 7 knowledge test. Study smarter, remember more, and move one step closer to the driver&apos;s seat.</p>
      <div className="hero-actions"><Link href="/practice" className="btn btn-primary">Try 10 practice questions <span aria-hidden="true">↗</span></Link><Link href="/about" className="btn btn-outline">How it works</Link></div>
      <div className="hero-trust"><span className="trust-icon">✓</span> No sign-up required <span className="trust-separator">•</span> Free starter content <span className="trust-separator">•</span> Works on your phone</div>
    </div><div className="hero-visual" aria-hidden="true"><div className="sun-disc" /><div className="mountain mountain-back"/><div className="mountain mountain-front"/><div className="road-shape"><div className="road-dash one"/><div className="road-dash two"/><div className="road-dash three"/></div><div className="hero-floating-badge"><span className="badge-mini-icon">✓</span><div><strong>30 questions</strong><small>on Alberta&apos;s real test</small></div></div><div className="route-pin">7</div></div></div></section>
    <section className="page-width dashboard-section"><div className="section-header"><div><span className="section-kicker">YOUR JOURNEY</span><h2>Small steps. Big progress.</h2><p>Pick up where you left off—your starter results are saved on this device.</p></div><div className="source-pill">ALBERTA CLASS 7</div></div><DashboardProgress /></section>
    <section className="feature-wrap"><div className="page-width"><div className="section-header"><div><span className="section-kicker">BUILT FOR REAL LEARNING</span><h2>Everything you need to get rolling.</h2></div></div><div className="feature-grid">{benefits.map((b)=><article key={b.title} className="feature-card"><span className="feature-icon" aria-hidden="true">{b.icon}</span><h3>{b.title}</h3><p>{b.text}</p></article>)}</div></div></section>
    <section className="page-width ready-banner"><div><span className="section-kicker on-dark">READY WHEN YOU ARE</span><h2>Your first 10 questions<br/>are waiting.</h2><p>Start with a short, original introductory quiz. It&apos;s a preview—not a substitute for the official Driver&apos;s Guide.</p></div><Link href="/practice" className="btn btn-yellow">Start learning <span aria-hidden="true">↗</span></Link></section>
  </>;
}
