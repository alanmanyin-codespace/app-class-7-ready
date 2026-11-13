"use client";
import { useEffect, useRef, useState } from "react";
import type { AnswerMap, Question } from "@/lib/quiz";
import { sampleQuestions, scoreQuiz, validateQuestionBank, passedOfficialStyleMock } from "@/lib/quiz";
import { saveCompletedAttempt } from "@/lib/progress";
import { clearSession, loadSession, saveSession, type FlagMap, type QuizMode } from "@/lib/session";
import Link from "next/link";

type Props = { questions: readonly Question[] };

function FlagIcon() {
  return <svg className="flag-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3.5 14.5v-12M3.5 2.5h8l-1.75 3 1.75 3h-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function PracticeQuiz({ questions }: Props) {
  // Stable initial order prevents random server/client hydration differences.
  const [selected, setSelected] = useState<Question[]>([]);
  const [mode, setMode] = useState<QuizMode>(10);
  const [instantFeedback, setInstantFeedback] = useState(true);
  const [startError, setStartError] = useState("");
  const bankErrors = validateQuestionBank(questions);
  const bankReady = bankErrors.length === 0;
  function startQuiz(count: QuizMode) {
    if (!bankReady || questions.length < count) { setStartError("This practice mode is unavailable because the validated question bank is insufficient."); return; }
    try { setSelected(sampleQuestions(questions, count)); setMode(count); setInstantFeedback(count === 30 ? false : instantFeedback); setIndex(0); setAnswers({}); setChecked({}); setFlagged({}); setReviewing(false); setResumed(false); setFinished(false); setStored(true); setReviewMissedOnly(false); setStartError(""); }
    catch { setStartError("Unable to start practice with this question bank."); }
  }
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [checked, setChecked] = useState<FlagMap>({});
  const [flagged, setFlagged] = useState<FlagMap>({});
  const [reviewing, setReviewing] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [isFinished, setFinished] = useState(false);
  const [stored, setStored] = useState(true);
  const [reviewMissedOnly, setReviewMissedOnly] = useState(false);
  const answeredCount = selected.filter((question) => question.options.some((option) => option.id === answers[question.id])).length;
  const flaggedCount = selected.filter((question) => flagged[question.id]).length;
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const modeHeadingRef = useRef<HTMLHeadingElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const feedbackHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusModeOnReturn = useRef(false);
  const focusFeedback = useRef(false);
  const wasReviewing = useRef(false);

  // Restore an in-progress session from this tab after a refresh.
  useEffect(() => {
    const restore = window.setTimeout(() => {
      const session = loadSession(questions);
      if (!session) return;
      setMode(session.mode); setInstantFeedback(session.mode === 30 ? false : session.instantFeedback); setSelected(session.questions);
      setIndex(session.index); setAnswers(session.answers); setChecked(session.checked); setFlagged(session.flagged); setResumed(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [questions]);
  // Keep the in-progress session in sessionStorage; submitted or abandoned sessions are cleared elsewhere.
  useEffect(() => {
    if (selected.length > 0 && !isFinished) saveSession({ mode, instantFeedback, questionIds: selected.map((q) => q.id), index, answers, checked, flagged });
  }, [selected, isFinished, mode, instantFeedback, index, answers, checked, flagged]);

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
  // Opening the pre-submit review moves focus to its heading; closing it returns focus to the question.
  useEffect(() => {
    if (reviewing) reviewHeadingRef.current?.focus();
    else if (wasReviewing.current) questionHeadingRef.current?.focus();
    wasReviewing.current = reviewing;
  }, [reviewing]);
  // After "Check answer", focus the feedback heading so the result is announced.
  useEffect(() => {
    if (focusFeedback.current) { feedbackHeadingRef.current?.focus(); focusFeedback.current = false; }
  }, [checked]);

  const current = selected[index];
  const score = isFinished ? scoreQuiz(selected, answers) : null;
  const isAnswered = (q: Question) => q.options.some((option) => option.id === answers[q.id]);
  const locked = !!current && mode !== 30 && instantFeedback && !!checked[current.id];
  const needsCheck = !!current && mode !== 30 && instantFeedback && !!answers[current.id] && !checked[current.id];

  function goTo(target: number) { setResumed(false); setIndex(target); }
  function checkAnswer() { if (mode === 30 || !current || !answers[current.id]) return; focusFeedback.current = true; setResumed(false); setChecked((prev) => ({ ...prev, [current.id]: true })); }
  function toggleFlag() { if (!current) return; setFlagged((prev) => { const next = { ...prev }; if (next[current.id]) delete next[current.id]; else next[current.id] = true; return next; }); }
  function reviewUnanswered() {
    // Search forward, then wrap, so the button advances even if the current question is blank.
    const nextUnanswered = Array.from({ length: selected.length - 1 }, (_, offset) => (index + offset + 1) % selected.length)
      .find((candidate) => !selected[candidate].options.some((option) => option.id === answers[selected[candidate].id]));
    if (nextUnanswered !== undefined) setIndex(nextUnanswered);
    else questionHeadingRef.current?.focus(); // Only the current question is unanswered; keep keyboard focus useful.
  }
  function finishQuiz(confirmed = false) {
    if (mode !== 30 && answeredCount < selected.length) return;
    if (!confirmed && mode === 30 && answeredCount < selected.length && !window.confirm(`Submit with ${selected.length - answeredCount} unanswered question(s)? Unanswered questions count as incorrect.`)) return;
    const result = scoreQuiz(selected, answers);
    const saved = saveCompletedAttempt(result);
    clearSession();
    setStored(saved);
    setReviewing(false);
    setFinished(true);
  }
  function exitQuiz() {
    if (answeredCount > 0 && !window.confirm("Leave this quiz? Your current answers will be lost.")) return;
    chooseAnotherMode();
  }
  function restart() { startQuiz(mode); }
  function chooseAnotherMode() { focusModeOnReturn.current = true; setSelected([]); setIndex(0); setAnswers({}); setChecked({}); setFlagged({}); setReviewing(false); setResumed(false); setFinished(false); setReviewMissedOnly(false); setStartError(""); clearSession(); }

  function questionStatus(q: Question) {
    if (mode !== 30 && instantFeedback && checked[q.id]) return answers[q.id] === q.answerId ? "correct" : "incorrect";
    return isAnswered(q) ? "answered" : "unanswered";
  }
  function renderMap() {
    return <>
      <ol className="qmap-grid">{selected.map((q, i) => { const status = questionStatus(q); return <li key={q.id}><button type="button" className={`qmap-cell is-${status}${flagged[q.id] ? " is-flagged" : ""}${i === index && !reviewing ? " is-current" : ""}`} aria-current={i === index && !reviewing ? "step" : undefined} aria-label={`Question ${i + 1}: ${status === "unanswered" ? "not answered" : status}${flagged[q.id] ? ", flagged for review" : ""}`} onClick={() => { setReviewing(false); goTo(i); }}>{i + 1}</button></li>; })}</ol>
      <ul className="qmap-key" aria-label="Map key">
        {instantFeedback ? <><li><span className="key-swatch is-correct" aria-hidden="true"/>Correct</li><li><span className="key-swatch is-incorrect" aria-hidden="true"/>Incorrect</li></> : <li><span className="key-swatch is-answered" aria-hidden="true"/>Answered</li>}
        <li><span className="key-swatch is-unanswered" aria-hidden="true"/>Not answered</li>
        <li><span className="key-swatch is-flagged" aria-hidden="true"/>Flagged</li>
      </ul>
    </>;
  }

  if (selected.length === 0) {
    return <section className="quiz-panel mode-picker" aria-labelledby="practice-mode-title"><div className="mode-intro"><h2 className="mode-title" id="practice-mode-title" ref={modeHeadingRef} tabIndex={-1}>Choose practice or a mock exam</h2><p>Practice with 10 or 20 questions, or take a 30-question mock exam. The mock requires 25 correct answers to pass. Each session draws unique questions.</p></div><fieldset className="answers-list mode-options"><legend className="mode-legend">Session mode</legend>{([10,20,30] as const).map(count => <label className={`answer-option mode-option ${mode === count ? "selected" : ""}`} key={count}><input type="radio" name="practice-length" value={count} checked={mode === count} disabled={!bankReady || questions.length < count} onChange={() => setMode(count)}/><span className="mode-count" aria-hidden="true">{count}</span><span className="mode-text">{count === 30 ? "30-question mock exam (25 correct to pass)" : `${count} questions`}</span>{(!bankReady || questions.length < count) && <span className="mode-text"> (unavailable)</span>}</label>)}</fieldset>
      <label className="feedback-toggle"><input type="checkbox" role="switch" checked={mode === 30 ? false : instantFeedback} disabled={mode === 30} onChange={(event) => setInstantFeedback(event.target.checked)}/><span className="toggle-track" aria-hidden="true"><span className="toggle-thumb"/></span><span className="toggle-copy"><strong>Show answers as I go</strong><span>{mode === 30 ? "Mock exams always hide answers until submission." : "Check each answer to see if you were right, with the explanation. Turn this off for a realistic exam where answers appear only after you submit."}</span></span></label>
      <div className="mode-footer"><p className="mode-status" role="status">{bankReady ? `${questions.length} validated questions available.` : "Question bank validation failed; practice is unavailable."}</p>{startError && <p role="alert" className="warning-note">{startError}</p>}<button className="btn btn-primary" type="button" disabled={!bankReady || questions.length < mode} onClick={() => startQuiz(mode)}>Start {mode === 30 ? "30-question mock exam" : `${mode}-question practice`} →</button></div></section>;
  }
  if (isFinished && score) {
    return <article className="quiz-panel result-panel"><div className="result-summary"><div className="result-heading"><div className="result-state"><div className="result-mark" aria-hidden="true">{mode === 30 && !passedOfficialStyleMock(score) ? "×" : "✓"}</div><span className="card-overline">{mode === 30 ? "MOCK EXAM COMPLETE" : "PRACTICE COMPLETE"}</span></div><h2 ref={resultsHeadingRef} tabIndex={-1}>You scored {score.correct} out of {score.total}.</h2><p className="result-breakdown" role="status" aria-label="Answer breakdown">{score.correct} correct · {score.answered - score.correct} incorrect · {score.total - score.answered} unanswered</p>{mode === 30 && <p role="status"><strong>{passedOfficialStyleMock(score) ? "PASS" : "NOT PASSED"} — {score.correct}/30 correct; 25 required to pass.</strong></p>}</div><p className="result-large">{score.percent}%</p></div><p className="result-message">{mode === 30 && !passedOfficialStyleMock(score) ? "You have not reached the mock exam pass threshold yet. Review missed and unanswered questions below, then try another mock." : score.correct === score.total ? "Excellent work! You answered every question correctly." : "Nice progress. Review the explanations below to strengthen your understanding."}</p>{!stored && <p role="status" className="warning-note">This browser could not save your result. Your current results are still shown below.</p>}
      <div className="result-actions"><button className="btn btn-primary" onClick={restart}>Try again ↗</button><button className="btn btn-outline" type="button" onClick={chooseAnotherMode}>Choose another mode</button><Link className="btn btn-outline" href="/">Back to home</Link></div>
      <div className="review-stack"><div className="review-toolbar"><div><h3>Review your answers</h3><p role="status" aria-live="polite">{reviewMissedOnly ? `Showing ${score.total - score.correct} missed or unanswered questions out of ${score.total}.` : `Showing all ${score.total} questions.`}</p></div><button className="btn btn-outline" type="button" aria-pressed={reviewMissedOnly} onClick={() => setReviewMissedOnly((previous) => !previous)}>{reviewMissedOnly ? "Show all answers" : `Show missed and unanswered only (${score.total - score.correct})`}</button></div>{reviewMissedOnly && score.correct === score.total && <p role="status">No missed or unanswered questions. Show all answers to review your explanations.</p>}{selected.map((q, i) => { if (reviewMissedOnly && answers[q.id] === q.answerId) return null; const answer=q.options.find(o=>o.id===answers[q.id]); const correct=q.options.find(o=>o.id===q.answerId); const ok=answers[q.id]===q.answerId; return <div className="review-item" key={q.id}><div className="review-header"><span>QUESTION {i+1}</span><strong className={ok ? "text-correct" : "text-incorrect"}>{ok ? "Correct" : answer ? "Incorrect" : "Unanswered"}</strong></div><h4>{q.prompt}</h4><p>Your answer: {answer?.text ?? "Not answered"}</p>{!ok && <p>Correct answer: <strong>{correct?.text}</strong></p>}<p className="review-explanation">{q.explanation}</p><p className="aside-caption">Source last checked: <time dateTime={q.sourceCheckedAt}>{q.sourceCheckedAt}</time></p><a href={q.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`View Alberta government source for question ${i + 1} (opens in a new tab)`}>View Alberta government source ↗</a></div>; })}</div>
    </article>;
  }
  if (reviewing) {
    const unansweredIdx = selected.map((q, i) => (isAnswered(q) ? -1 : i)).filter((i) => i >= 0);
    const flaggedIdx = selected.map((q, i) => (flagged[q.id] ? i : -1)).filter((i) => i >= 0);
    const jumpList = (list: number[], label: string) => <ul className="jump-list" aria-label={label}>{list.map((i) => <li key={i}><button type="button" className="jump-chip" aria-label={`Question ${i + 1}`} onClick={() => { setReviewing(false); goTo(i); }}>{i + 1}</button></li>)}</ul>;
    return <section className="quiz-panel review-screen" aria-labelledby="review-title">
      <h2 id="review-title" ref={reviewHeadingRef} tabIndex={-1}>Review before you submit</h2>
      <p className="review-intro">{instantFeedback ? "You can still answer any question you have not checked yet." : "You can still change any answer before you submit."} Your score appears after submission.</p>
      <dl className="review-stats"><div><dt>Answered</dt><dd>{answeredCount}<span>/{selected.length}</span></dd></div><div className={unansweredIdx.length ? "is-warning" : ""}><dt>Unanswered</dt><dd>{unansweredIdx.length}</dd></div><div><dt>Flagged</dt><dd>{flaggedCount}</dd></div></dl>
      {unansweredIdx.length > 0 && <div className="review-group"><h3>Unanswered</h3><p className="warning-note">Unanswered questions count as incorrect.</p>{jumpList(unansweredIdx, "Jump to an unanswered question")}</div>}
      {flaggedIdx.length > 0 && <div className="review-group"><h3>Flagged for review</h3>{jumpList(flaggedIdx, "Jump to a flagged question")}</div>}
      {unansweredIdx.length === 0 && flaggedIdx.length === 0 && <p className="review-ready">Every question is answered and nothing is flagged. You are ready to submit.</p>}
      <div className="review-actions"><button className="btn btn-outline" type="button" onClick={() => setReviewing(false)}>← Back to questions</button><button className="btn btn-primary" type="button" disabled={mode !== 30 && answeredCount < selected.length} onClick={() => finishQuiz(true)}>{mode === 30 ? "Submit mock exam ↗" : "Finish practice ↗"}</button></div>
    </section>;
  }
  const chosen = current.options.find((o) => o.id === answers[current.id]);
  const correctOption = current.options.find((o) => o.id === current.answerId);
  const gotIt = answers[current.id] === current.answerId;
  return <div className="quiz-layout">{resumed && <p className="resume-note" role="status">Welcome back. Your {mode === 30 ? "mock exam" : "practice"} was restored where you left off. <button className="btn-text" type="button" onClick={exitQuiz}>Start over</button></p>}<article className="quiz-panel"><div className="quiz-panel-top"><span className="card-overline">{mode === 30 ? "MOCK EXAM" : "PRACTICE MODE"}</span><span className="quiz-count">{index + 1} / {selected.length}</span></div><div className="quiz-progress-track" role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={selected.length} aria-valuenow={answeredCount}><div style={{width:`${(answeredCount/selected.length)*100}%`}} /></div><p className="quiz-status" role="status" aria-live="polite">{answeredCount} of {selected.length} answered{flaggedCount ? ` · ${flaggedCount} flagged` : ""}{mode === 30 && answeredCount < selected.length ? ` · ${selected.length - answeredCount} unanswered will count as incorrect` : ""}</p>
    <details className="qmap-disclosure"><summary>Question map</summary>{renderMap()}</details>
    <div className="question-meta"><span className="topic-tag">{current.topic}</span>{flagged[current.id] && <span className="flag-badge"><FlagIcon/>Flagged</span>}</div><h2 className="quiz-question" ref={questionHeadingRef} tabIndex={-1}>{current.prompt}</h2><fieldset className={`answers-list${locked ? " is-locked" : ""}`}><legend className="sr-only">Question {index + 1} of {selected.length}: {current.prompt}. Select one answer.</legend>{current.options.map((opt, i) => <label className={`answer-option ${answers[current.id] === opt.id ? "selected" : ""}${locked && opt.id === current.answerId ? " is-correct" : ""}${locked && answers[current.id] === opt.id && opt.id !== current.answerId ? " is-wrong" : ""}`} key={opt.id}><input type="radio" name={`question-${current.id}`} value={opt.id} checked={answers[current.id]===opt.id} disabled={locked} onChange={() => setAnswers((prev)=>({...prev,[current.id]:opt.id}))}/><span className="answer-letter">{String.fromCharCode(65+i)}</span><span>{opt.text}</span>{locked && opt.id === current.answerId ? <span className="answer-verdict">Correct answer</span> : locked && answers[current.id] === opt.id ? <span className="answer-verdict">Your answer</span> : <span className="answer-check">✓</span>}</label>)}</fieldset>
    {locked && <div className={`answer-feedback ${gotIt ? "is-correct" : "is-wrong"}`}><h3 ref={feedbackHeadingRef} tabIndex={-1}>{gotIt ? "Correct" : "Not quite"}</h3>{!gotIt && <p>You chose “{chosen?.text}”. The correct answer is <strong>{correctOption?.text}</strong>.</p>}<p>{current.explanation}</p><a href={current.sourceUrl} target="_blank" rel="noopener noreferrer">Alberta government source (opens in a new tab) ↗</a></div>}
    <div className="quiz-aux">{!locked && <>{answers[current.id] && <button className="btn-text" type="button" onClick={() => setAnswers(prev => { const next = { ...prev }; delete next[current.id]; return next; })}>Clear answer (leave unanswered)</button>}</>}<button className="btn-text flag-toggle" type="button" aria-pressed={!!flagged[current.id]} onClick={toggleFlag}><FlagIcon/>{flagged[current.id] ? "Remove flag" : "Flag for review"}</button>{answeredCount < selected.length && <button className="btn-text" type="button" onClick={reviewUnanswered}>Review unanswered ({selected.length - answeredCount})</button>}</div><div className="quiz-controls"><button className="btn-text quiz-exit" type="button" onClick={exitQuiz}>Change mode</button><div className="quiz-nav"><button className="btn btn-outline" disabled={index===0} onClick={()=>goTo(index - 1)}>← Previous</button>{needsCheck && <button className="btn btn-primary" type="button" onClick={checkAnswer}>Check answer</button>}{index < selected.length - 1 && <button className={locked ? "btn btn-primary" : "btn btn-outline"} type="button" onClick={()=>setIndex((i)=>i+1)}>Next question →</button>}{<button className="btn btn-outline" type="button" onClick={() => setReviewing(true)}>{mode === 30 ? "Review and submit" : "Review questions"}</button>}{mode !== 30 && answeredCount === selected.length && <button className="btn btn-primary" type="button" onClick={() => finishQuiz()}>Finish quiz ↗</button>}</div></div></article>
    <aside className="quiz-aside" aria-label="Question map"><h3>Question map</h3><p className="aside-caption">{answeredCount} of {selected.length} answered{flaggedCount ? ` · ${flaggedCount} flagged` : ""}. Select a number to jump to that question.</p>{renderMap()}<div className="aside-divider"/><p className="aside-caption">{instantFeedback ? "Answers are shown as you go. Each checked answer is locked in." : "Answers are shown after you submit. You can change any answer until then."} {mode === 30 ? "The mock exam needs 25 of 30 correct to pass. It is an independent practice simulation, not the official Alberta test." : "This is practice, not an official test."}</p></aside>
  </div>;
}
