import type { Metadata } from "next";
import { PracticeQuiz } from "@/components/practice-quiz";
import { starterQuestions } from "@/data/questions";

export const metadata: Metadata = { title: "Practice questions" };
export default function PracticePage() {
  return <section className="page-width practice-page"><div className="subpage-heading"><span className="section-kicker">PRACTICE & MOCK EXAM · 10 / 20 / 30 QUESTIONS</span><h1>Choose practice or a full mock exam.</h1><p>Choose 10 or 20 questions for practice, or take a full 30-question mock exam with a 25-correct pass threshold. All questions are drawn from our validated, source-linked study bank. This independent simulation is not the official Alberta exam.</p></div><PracticeQuiz questions={starterQuestions}/></section>;
}
