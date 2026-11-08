"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadAttempts, type SavedAttempt } from "@/lib/progress";

export function DashboardProgress() {
  const [attempts, setAttempts] = useState<SavedAttempt[]>([]);
  useEffect(() => {
    // Read browser storage after hydration and refresh when another tab updates it.
    const refresh = () => setAttempts(loadAttempts());
    const initialRefresh = window.setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(initialRefresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const best = attempts.length ? Math.max(...attempts.map((a) => a.score.percent)) : 0;
  const latest = attempts[0];
  return <div className="progress-grid">
    <article className="progress-main"><div className="progress-main-top"><div><span className="card-overline">YOUR LEARNING SNAPSHOT</span><h3>{attempts.length ? "Keep up the momentum!" : "Your journey starts here."}</h3><p>{attempts.length ? "Every session helps reinforce what you know." : "Complete your first practice quiz to begin tracking your progress."}</p></div><div className="progress-illustration" aria-hidden="true">↗</div></div><div className="stat-row"><div><strong>{attempts.length}</strong><span>quizzes completed</span></div><div><strong>{best}%</strong><span>best starter score</span></div><div><strong>{latest ? `${latest.score.correct}/${latest.score.total}` : "—"}</strong><span>most recent result</span></div></div><Link href="/practice" className="inline-link">{attempts.length ? "Take another quiz" : "Get started"} <span aria-hidden="true">→</span></Link></article>
    <article className="exam-card"><div className="exam-card-heading"><span className="exam-icon">★</span><span className="tag">OFFICIAL TEST FORMAT</span></div><h3>Know your target.</h3><div className="exam-score">25<span>/30</span></div><p>Correct answers needed to pass Alberta&apos;s official knowledge test.</p><div className="exam-footnote">Full-length mock exam coming after the question bank is reviewed.</div></article>
  </div>;
}
