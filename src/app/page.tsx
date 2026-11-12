import Link from "next/link";
import { DashboardProgress } from "@/components/dashboard-progress";
import { HomeHero } from "@/components/home-hero";

const benefits = [
  { icon: "◎", title: "Learn the essentials", text: "Build confidence with clear explanations and source links." },
  { icon: "◷", title: "Practice your way", text: "Start with a 10-question introduction. Bigger exam modes are coming." },
  { icon: "↗", title: "See your progress", text: "Your completed starter quizzes stay in this browser." },
];

export default function Home() {
  return <>
    <HomeHero/>
    <section className="page-width dashboard-section"><div className="section-header"><div><h2>Small steps. Big progress.</h2><p>Pick up where you left off—your starter results are saved on this device.</p></div><div className="source-pill">ALBERTA CLASS 7</div></div><DashboardProgress /></section>
    <section className="feature-wrap"><div className="page-width"><div className="section-header"><div><h2>Everything you need to get rolling.</h2></div></div><ul className="feature-grid">{benefits.map((b)=><li key={b.title} className="feature-card"><span className="feature-icon" aria-hidden="true">{b.icon}</span><h3>{b.title}</h3><p>{b.text}</p></li>)}</ul></div></section>
    <section className="page-width ready-banner"><div><h2>Your first 10 questions<br/>are waiting.</h2><p>Start with a short, original introductory quiz. It&apos;s a preview—not a substitute for the official Driver&apos;s Guide.</p></div><Link href="/practice" className="btn btn-yellow">Start learning <span aria-hidden="true">↗</span></Link></section>
  </>;
}
