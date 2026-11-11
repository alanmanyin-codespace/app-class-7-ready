"use client";
import { useEffect, useRef, useState } from "react";
import type { AnswerMap, Question } from "@/lib/quiz";
import { sampleQuestions, scoreQuiz, validateQuestionBank, passedOfficialStyleMock } from "@/lib/quiz";
import { saveCompletedAttempt } from "@/lib/progress";
import Link from "next/link";

type Props = { questions: readonly Question[] };

export function PracticeQuiz({ questions }: Props) {
  // Stable initial order prevents random server/client hydration differences.
  const [selected, setSelected] = useState<Question[]>([]);
  const [mode, setMode] = useState<10 | 20 | 30>(10);
  const [startError, setStartError] = useState("");
  const bankErrors = validateQuestionBank(questions);
  const bankReady = bankErrors.length === 0;
  function startQuiz(count: 10 | 20 | 30) {
    if (!bankReady || questions.length < count) { setStartError("This practice mode is unavailable because the validated question bank is insufficient."); return; }
    try { setSelected(sampleQuestions(questions, count)); setMode(count); setIndex(0); setAnswers({}); setFinished(false); setStored(true); setStartError(""); }
    catch { setStartError("Unable to start practice with this question bank."); }
  }
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [isFinished, setFinished] = useState(false);
  const [stored, setStored] = useState(true);
  const answeredCount = selected.filter((question) => question.options.some((option) => option.id === answers[question.id])).length;
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const modeHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusModeOnReturn = useRef(false);
  useEffect(() => {
    if (selected.length === 0 && focusModeOnReturn.current) {
      modeHeadingRef.current?.focus();
      focusModeOnReturn.current = false;
    }
  }, [selected]);
  // Move keyboard and screen-reader focus to each newly displayed question.
  useEffect(() => {
    if (selected.length > 0 && !isFinished) questionHeadingRef.current?.focus();
  }, [index, selected, isFinished]);
  // Submission replaces the active question with results; announce that transition to keyboard users.
  useEffect(() => {
    if (isFinished) resultsHeadingRef.current?.focus();
  }, [isFinished]);
  const current = selected[index];
  const score = isFinished ? scoreQuiz(selected, answers) : null;

  function reviewUnanswered() {
    // Search forward, then wrap, so the button advances even if the current question is blank.
    const nextUnanswered = Array.from({ length: selected.length - 1 }, (_, offset) => (index + offset + 1) % selected.length)
      .find((candidate) => !selected[candidate].options.some((option) => option.id === answers[selected[candidate].id]));
    if (nextUnanswered !== undefined) setIndex(nextUnanswered);
    else questionHeadingRef.current?.focus(); // Only the current question is unanswered; keep keyboard focus useful.
  }
  function finishQuiz() {
    if (mode === 30 && answeredCount < selected.length && !window.confirm(`Submit with ${selected.length - answeredCount} unanswered question(s)? Unanswered questions count as incorrect.`)) return;
    const result = scoreQuiz(selected, answers);
    const saved = saveCompletedAttempt(result);
    setStored(saved);
    setFinished(true);
  }
  function exitQuiz() {
    if (!window.confirm("Leave this quiz? Your current answers will be lost.")) return;
    chooseAnotherMode();
  }
  function restart() { startQuiz(mode); }
  function chooseAnotherMode() { focusModeOnReturn.current = true; setSelected([]); setIndex(0); setAnswers({}); setFinished(false); setStartError(""); }

  if (selected.length === 0) {
    return <section className="quiz-panel" aria-labelledby="practice-mode-title"><span className="section-kicker">CHOOSE YOUR PRACTICE</span><h2 id="practice-mode-title" ref={modeHeadingRef} tabIndex={-1}>Choose practice or a mock exam</h2><p>Practice with 10 or 20 questions, or take a 30-question mock exam. The mock requires 25 correct answers to pass. Each session draws unique questions; answers appear only after submission.</p><fieldset className="answers-list"><legend>Session mode</legend>{([10,20,30] as const).map(count => <label className={`answer-option ${mode === count ? "selected" : ""}`} key={count}><input type="radio" name="practice-length" value={count} checked={mode === count} disabled={!bankReady || questions.length < count} onChange={() => setMode(count)}/><span>{count === 30 ? "30-question mock exam (25 correct to pass)" : `${count} questions`}</span>{(!bankReady || questions.length < count) && <span> (unavailable)</span>}</label>)}</fieldset><p role="status">{bankReady ? `${questions.length} validated questions available.` : "Question bank validation failed; practice is unavailable."}</p>{startError && <p role="alert" className="warning-note">{startError}</p>}<button className="btn btn-primary" type="button" disabled={!bankReady || questions.length < mode} onClick={() => startQuiz(mode)}>Start {mode === 30 ? "30-question mock exam" : `${mode}-question practice`} →</button></section>;
  }
  if (isFinished && score) {
    return <article className="quiz-panel result-panel"><div className="result-mark" aria-hidden="true">✓</div><span className="section-kicker">{mode === 30 ? "MOCK EXAM COMPLETE" : "PRACTICE COMPLETE"}</span><h2 ref={resultsHeadingRef} tabIndex={-1}>You scored {score.correct} out of {score.total}.</h2><p className="result-large">{score.percent}%</p><p role="status" aria-label="Answer breakdown">{score.correct} correct · {selected.filter((q) => answers[q.id] && answers[q.id] !== q.answerId).length} incorrect · {selected.filter((q) => !answers[q.id]).length} unanswered</p>{mode === 30 && <p role="status"><strong>{passedOfficialStyleMock(score) ? "PASS" : "NOT PASSED"} — {score.correct}/30 correct; 25 required to pass.</strong></p>}<p>{score.correct === score.total ? "Excellent work! You answered every question correctly." : "Nice progress. Review the explanations below to strengthen your understanding."}</p>{!stored && <p role="status" className="warning-note">This browser could not save your result. Your current results are still shown below.</p>}
      <div className="result-actions"><button className="btn btn-primary" onClick={restart}>Try again ↗</button><button className="btn btn-outline" type="button" onClick={chooseAnotherMode}>Choose another mode</button><Link className="btn btn-outline" href="/">Back to home</Link></div>
      <div className="review-stack"><h3>Review your answers</h3>{selected.map((q, i) => { const answer=q.options.find(o=>o.id===answers[q.id]); const correct=q.options.find(o=>o.id===q.answerId); const ok=answers[q.id]===q.answerId; return <div className="review-item" key={q.id}><div className="review-header"><span>QUESTION {i+1}</span><strong className={ok ? "text-correct" : "text-incorrect"}>{ok ? "Correct" : answer ? "Needs review" : "Unanswered"}</strong></div><h4>{q.prompt}</h4><p>Your answer: {answer?.text ?? "Not answered"}</p>{!ok && <p>Correct answer: <strong>{correct?.text}</strong></p>}<p className="review-explanation">{q.explanation}</p><p className="aside-caption">Source last checked: <time dateTime={q.sourceCheckedAt}>{q.sourceCheckedAt}</time></p><a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">View Alberta government source ↗</a></div>; })}</div>
    </article>;
  }
  return <div className="quiz-layout"><article className="quiz-panel"><div className="quiz-panel-top"><span className="card-overline">{mode === 30 ? "MOCK EXAM" : "PRACTICE MODE"}</span><span className="quiz-count">{index + 1} / {selected.length}</span></div><div className="quiz-progress-track" role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={selected.length} aria-valuenow={answeredCount}><div style={{width:`${(answeredCount/selected.length)*100}%`}} /></div><p className="aside-caption" role="status" aria-live="polite">{answeredCount} of {selected.length} answered{mode === 30 && answeredCount < selected.length ? ` · ${selected.length - answeredCount} unanswered will count as incorrect` : ""}</p><span className="topic-tag">{current.topic}</span><h2 className="quiz-question" ref={questionHeadingRef} tabIndex={-1}>{current.prompt}</h2><fieldset className="answers-list"><legend className="sr-only">Question {index + 1} of {selected.length}: {current.prompt}. Select one answer.</legend>{current.options.map((opt, i) => <label className={`answer-option ${answers[current.id] === opt.id ? "selected" : ""}`} key={opt.id}><input type="radio" name={`question-${current.id}`} value={opt.id} checked={answers[current.id]===opt.id} onChange={() => setAnswers((prev)=>({...prev,[current.id]:opt.id}))}/><span className="answer-letter">{String.fromCharCode(65+i)}</span><span>{opt.text}</span><span className="answer-check">✓</span></label>)}</fieldset>{answeredCount < selected.length && <button className="btn btn-outline" type="button" onClick={reviewUnanswered}>Review unanswered ({selected.length - answeredCount})</button>}<div className="quiz-controls"><button className="btn btn-outline" type="button" onClick={exitQuiz}>Change mode</button><button className="btn btn-outline" disabled={index===0} onClick={()=>setIndex((i)=>i-1)}>← Previous</button>{index < selected.length - 1 && <button className="btn btn-outline" type="button" onClick={()=>setIndex((i)=>i+1)} disabled={mode !== 30 && !answers[current.id]}>Next question →</button>}{(mode === 30 || index===selected.length-1 || answeredCount===selected.length) && <button className="btn btn-primary" type="button" onClick={finishQuiz} disabled={mode !== 30 && answeredCount !== selected.length}>{mode === 30 ? "Submit mock exam ↗" : "Finish quiz ↗"}</button>}</div></article>
    <aside className="quiz-aside"><div className="aside-icon">✦</div><h3>One question at a time.</h3><p>Take your time—there&apos;s no timer. You can go back and change an answer before submitting. In mock mode, unanswered questions count as incorrect.</p><div className="aside-divider"/><p className="aside-caption">Your questions are sampled from the available verified study bank. This is not an official test.</p><div className="aside-divider"/><p className="aside-caption">The mock exam has 30 questions and requires 25 correct answers. It is an independent practice simulation, not the official Alberta test.</p></aside>
  </div>;
}
