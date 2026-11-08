import type { Metadata } from "next";
import { PracticeQuiz } from "@/components/practice-quiz";
import { starterQuestions } from "@/data/questions";

export const metadata: Metadata = { title: "Practice questions" };
export default function PracticePage() {
  return <section className="page-width practice-page"><div className="subpage-heading"><span className="section-kicker">PRACTICE MODE · STARTER SERIES</span><h1>Your first 10 questions.</h1><p>Original, introductory questions linked to Alberta government guidance. This is not a simulated official exam.</p></div><PracticeQuiz questions={starterQuestions}/></section>;
}
