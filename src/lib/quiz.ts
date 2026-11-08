export type Topic = "Test basics" | "Eligibility" | "Learner restrictions";

export type Question = {
  id: string;
  prompt: string;
  options: readonly { id: string; text: string }[];
  answerId: string;
  explanation: string;
  topic: Topic;
  sourceUrl: string;
  sourceCheckedAt: string;
};

export type AnswerMap = Record<string, string>;

export type QuizScore = {
  total: number;
  correct: number;
  answered: number;
  percent: number;
  incorrectIds: string[];
};

export function validateQuestionBank(questions: readonly Question[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const q of questions) {
    if (!q.id.trim() || ids.has(q.id)) errors.push(`Duplicate or blank id: ${q.id}`);
    ids.add(q.id);
    const options = new Set(q.options.map((o) => o.id));
    if (!q.prompt.trim() || !q.explanation.trim() || !q.sourceUrl.trim()) errors.push(`Incomplete question: ${q.id}`);
    if (q.options.length < 2 || options.size !== q.options.length || !options.has(q.answerId)) errors.push(`Invalid options/answer: ${q.id}`);
  }
  return errors;
}

export function sampleQuestions(questions: readonly Question[], count: number, random: () => number = Math.random): Question[] {
  if (!Number.isInteger(count) || count < 1 || questions.length < count) {
    throw new RangeError("Requested quiz size exceeds validated question bank");
  }
  const errors = validateQuestionBank(questions);
  if (errors.length) throw new Error(`Invalid question bank: ${errors.join("; ")}`);
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const r = random();
    if (!(r >= 0 && r < 1)) throw new RangeError("Random generator must return a value in [0,1)");
    const j = Math.floor(r * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function scoreQuiz(questions: readonly Question[], answers: Readonly<AnswerMap>): QuizScore {
  const correct = questions.filter((q) => answers[q.id] === q.answerId).length;
  const answered = questions.filter((q) => q.options.some((opt) => opt.id === answers[q.id])).length;
  return {
    total: questions.length,
    correct,
    answered,
    percent: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    incorrectIds: questions.filter((q) => answers[q.id] !== q.answerId).map((q) => q.id),
  };
}

export function passedOfficialStyleMock(score: QuizScore): boolean {
  return score.total === 30 && score.correct >= 25;
}
