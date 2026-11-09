export type Topic = "Test basics" | "Eligibility" | "Learner restrictions" | "School and playground zones" | "Intersections and right of way" | "Pedestrian safety" | "Roundabouts" | "Road signs" | "Winter driving" | "Distracted driving" | "Roadside worker safety";

export const QUESTION_SCHEMA_VERSION = 1 as const;

export type Question = {
  id: string;
  prompt: string;
  options: readonly { id: string; text: string }[];
  answerId: string;
  explanation: string;
  topic: Topic;
  sourceUrl: string;
  sourceCheckedAt: string;
  imageAlt?: string;
};

export type VersionedQuestionBank = {
  schemaVersion: typeof QUESTION_SCHEMA_VERSION;
  questions: readonly Question[];
};

export function validateVersionedQuestionBank(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["Question bank must be an object"];
  const bank = value as Record<string, unknown>;
  if (bank.schemaVersion !== QUESTION_SCHEMA_VERSION) return ["Unsupported question bank schemaVersion"];
  if (!Array.isArray(bank.questions)) return ["Question bank questions must be an array"];
  return validateQuestionBank(bank.questions as readonly Question[]);
}

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
  if (!Array.isArray(questions)) return ["Questions must be an array"];
  const ids = new Set<string>();
  const allowedTopics = new Set<Topic>(["Test basics", "Eligibility", "Learner restrictions", "School and playground zones", "Intersections and right of way", "Pedestrian safety", "Roundabouts", "Road signs", "Winter driving", "Distracted driving", "Roadside worker safety"]);
  const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
  for (const [index, candidate] of questions.entries()) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      errors.push(`Invalid question object at index ${index}`);
      continue;
    }
    const q = candidate as Question;
    const id = isText(q.id) ? q.id : `index-${index}`;
    if (!isText(q.id) || ids.has(q.id)) errors.push(`Duplicate or blank id: ${id}`);
    if (isText(q.id)) ids.add(q.id);
    if (!isText(q.prompt) || !isText(q.explanation)) errors.push(`Incomplete question: ${id}`);
    if (!allowedTopics.has(q.topic)) errors.push(`Invalid topic: ${id}`);
    if (q.imageAlt !== undefined && !isText(q.imageAlt)) errors.push(`Invalid imageAlt: ${id}`);
    if (!isText(q.sourceUrl)) {
      errors.push(`Missing sourceUrl: ${id}`);
    } else {
      try {
        const url = new URL(q.sourceUrl);
        if (url.protocol !== "https:" || !url.hostname || url.username || url.password) errors.push(`Invalid sourceUrl: ${id}`);
      } catch {
        errors.push(`Invalid sourceUrl: ${id}`);
      }
    }
    if (!isText(q.sourceCheckedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(q.sourceCheckedAt) ||
        !Number.isFinite(Date.parse(`${q.sourceCheckedAt}T00:00:00Z`)) ||
        new Date(`${q.sourceCheckedAt}T00:00:00Z`).toISOString().slice(0, 10) !== q.sourceCheckedAt) {
      errors.push(`Invalid sourceCheckedAt: ${id}`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`Invalid options/answer: ${id}`);
      continue;
    }
    const optionIds = new Set<string>();
    for (const option of q.options) {
      if (!option || typeof option !== "object" || !isText(option.id) || !isText(option.text)) {
        errors.push(`Invalid option content: ${id}`);
        continue;
      }
      if (optionIds.has(option.id)) errors.push(`Duplicate option id: ${id}`);
      optionIds.add(option.id);
    }
    if (!isText(q.answerId) || !optionIds.has(q.answerId)) errors.push(`Invalid options/answer: ${id}`);
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
