import type { Metadata } from "next";
import { PracticeQuiz } from "@/components/practice-quiz";
import { starterQuestions } from "@/data/questions";

export const metadata: Metadata = { title: "Practice questions" };
export default function PracticePage() {
  return <section className="page-width practice-page"><div className="subpage-heading"><span className="section-kicker">PRACTICE MODE · 10 OR 20 QUESTIONS</span><h1>Choose your practice length.</h1><p>Choose 10 or 20 unique questions drawn from our validated, source-linked study bank. This is not a simulated official exam.</p></div><PracticeQuiz questions={starterQuestions}/></section>;
}
