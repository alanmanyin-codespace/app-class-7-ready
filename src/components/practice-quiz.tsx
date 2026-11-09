"use client";
import { useState } from "react";
import type { AnswerMap, Question } from "@/lib/quiz";
import { sampleQuestions, scoreQuiz, validateQuestionBank } from "@/lib/quiz";
import { saveCompletedAttempt } from "@/lib/progress";
import Link from "next/link";

type Props = { questions: readonly Question[] };

export function PracticeQuiz({ questions }: Props) {
  // Stable initial order prevents random server/client hydration differences.
  const [selected, setSelected] = useState<Question[]>([]);
  const [mode, setMode] = useState<10 | 20>(10);
  const [startError, setStartError] = useState("");
  const bankErrors = validateQuestionBank(questions);
  const bankReady = bankErrors.length === 0;
  function startQuiz(count: 10 | 20) {
    if (!bankReady || questions.length < count) { setStartError("This practice mode is unavailable because the validated question bank is insufficient."); return; }
    try { setSelected(sampleQuestions(questions, count)); setMode(count); setIndex(0); setAnswers({}); setFinished(false); setStored(true); setStartError(""); }
    catch { setStartError("Unable to start practice with this question bank."); }
  }
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [isFinished, setFinished] = useState(false);
  const [stored, setStored] = useState(true);
  const current = selected[index];
  const score = isFinished ? scoreQuiz(selected, answers) : null;

  function finishQuiz() {
    const result = scoreQuiz(selected, answers);
    const saved = saveCompletedAttempt(result);
    setStored(saved);
    setFinished(true);
  }
  function restart() { startQuiz(mode); }

  if (selected.length === 0) {
    return <section className="quiz-panel" aria-labelledby="practice-mode-title"><span className="section-kicker">CHOOSE YOUR PRACTICE</span><h2 id="practice-mode-title">How many questions?</h2><p>Each session draws a fresh random set of unique questions from the validated bank. Answers appear after you finish.</p><fieldset className="answers-list"><legend>Practice length</legend>{([10,20] as const).map(count => <label className={`answer-option ${mode === count ? "selected" : ""}`} key={count}><input type="radio" name="practice-length" value={count} checked={mode === count} disabled={!bankReady || questions.length < count} onChange={() => setMode(count)}/><span>{count} questions</span>{(!bankReady || questions.length < count) && <span> (unavailable)</span>}</label>)}</fieldset><p role="status">{bankReady ? `${questions.length} validated questions available.` : "Question bank validation failed; practice is unavailable."}</p>{startError && <p role="alert" className="warning-note">{startError}</p>}<button className="btn btn-primary" type="button" disabled={!bankReady || questions.length < mode} onClick={() => startQuiz(mode)}>Start {mode}-question practice →</button></section>;
  }
  if (isFinished && score) {
    return <article className="quiz-panel result-panel"><div className="result-mark" aria-hidden="true">✓</div><span className="section-kicker">PRACTICE COMPLETE</span><h2>You scored {score.correct} out of {score.total}.</h2><p className="result-large">{score.percent}%</p><p>{score.correct === score.total ? "Excellent start! You answered every introductory question correctly." : "Nice progress. Review the explanations below to strengthen your understanding."}</p>{!stored && <p role="status" className="warning-note">This browser could not save your result. Your current results are still shown below.</p>}
      <div className="result-actions"><button className="btn btn-primary" onClick={restart}>Try again ↗</button><Link className="btn btn-outline" href="/">Back to home</Link></div>
      <div className="review-stack"><h3>Review your answers</h3>{selected.map((q, i) => { const answer=q.options.find(o=>o.id===answers[q.id]); const correct=q.options.find(o=>o.id===q.answerId); const ok=answers[q.id]===q.answerId; return <div className="review-item" key={q.id}><div className="review-header"><span>QUESTION {i+1}</span><strong className={ok ? "text-correct" : "text-incorrect"}>{ok ? "Correct" : "Needs review"}</strong></div><h4>{q.prompt}</h4><p>Your answer: {answer?.text ?? "Not answered"}</p>{!ok && <p>Correct answer: <strong>{correct?.text}</strong></p>}<p className="review-explanation">{q.explanation}</p><a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">View Alberta government source ↗</a></div>; })}</div>
    </article>;
  }
  return <div className="quiz-layout"><article className="quiz-panel"><div className="quiz-panel-top"><span className="card-overline">PRACTICE MODE</span><span className="quiz-count">{index + 1} / {selected.length}</span></div><div className="quiz-progress-track" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={selected.length} aria-valuenow={index + 1}><div style={{width:`${((index + 1)/selected.length)*100}%`}} /></div><span className="topic-tag">{current.topic}</span><h2 className="quiz-question">{current.prompt}</h2><fieldset className="answers-list"><legend className="sr-only">Select one answer</legend>{current.options.map((opt, i) => <label className={`answer-option ${answers[current.id] === opt.id ? "selected" : ""}`} key={opt.id}><input type="radio" name={`question-${current.id}`} checked={answers[current.id]===opt.id} onChange={() => setAnswers((prev)=>({...prev,[current.id]:opt.id}))}/><span className="answer-letter">{String.fromCharCode(65+i)}</span><span>{opt.text}</span><span className="answer-check">✓</span></label>)}</fieldset><div className="quiz-controls"><button className="btn btn-outline" disabled={index===0} onClick={()=>setIndex((i)=>i-1)}>← Previous</button>{index===selected.length-1?<button className="btn btn-primary" onClick={finishQuiz} disabled={Object.keys(answers).length!==selected.length}>Finish quiz ↗</button>:<button className="btn btn-primary" onClick={()=>setIndex((i)=>i+1)} disabled={!answers[current.id]}>Next question →</button>}</div></article>
    <aside className="quiz-aside"><div className="aside-icon">✦</div><h3>One question at a time.</h3><p>Take your time—there&apos;s no timer. You can go back and change an answer before submitting.</p><div className="aside-divider"/><p className="aside-caption">Your questions are sampled from the available verified study bank. This is not an official test.</p><div className="aside-divider"/><p className="aside-caption">Looking for the full mock exam? We&apos;ll enable it after the question bank is expanded and checked.</p></aside>
  </div>;
}
