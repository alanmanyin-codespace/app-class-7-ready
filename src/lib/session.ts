import type { AnswerMap, Question } from "./quiz";

/** In-progress quiz kept in sessionStorage so a refresh in the same tab does not lose answers. */
export const SESSION_KEY = "class7.session.v1";

export type QuizMode = 10 | 20 | 30;
export type FlagMap = Record<string, true>;

export type QuizSession = {
  mode: QuizMode;
  instantFeedback: boolean;
  questionIds: string[];
  index: number;
  answers: AnswerMap;
  checked: FlagMap;
  flagged: FlagMap;
};

export type RestoredSession = Omit<QuizSession, "questionIds"> & { questions: Question[] };

function isFlagMap(value: unknown): value is FlagMap {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((v) => v === true);
}

/**
 * Validate a stored session against the current question bank.
 * Returns null for anything malformed, stale or inconsistent, so a bad record
 * falls back to the mode picker instead of a broken quiz.
 */
export function parseSession(raw: string | null, bank: readonly Question[]): RestoredSession | null {
  if (!raw) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const s = value as Partial<QuizSession>;
  if (s.mode !== 10 && s.mode !== 20 && s.mode !== 30) return null;
  if (typeof s.instantFeedback !== "boolean") return null;
  if (!Array.isArray(s.questionIds) || s.questionIds.length !== s.mode) return null;
  if (new Set(s.questionIds).size !== s.questionIds.length) return null;
  const byId = new Map(bank.map((q) => [q.id, q]));
  const questions = s.questionIds.map((id) => (typeof id === "string" ? byId.get(id) : undefined));
  if (questions.some((q) => !q)) return null;
  const selected = questions as Question[];
  if (typeof s.index !== "number" || !Number.isInteger(s.index) || s.index < 0 || s.index >= selected.length) return null;
  if (!s.answers || typeof s.answers !== "object" || Array.isArray(s.answers)) return null;
  if (!isFlagMap(s.checked) || !isFlagMap(s.flagged)) return null;
  const inSession = new Set(s.questionIds);
  // Keep only answers that are valid options of questions in this session.
  const answers: AnswerMap = {};
  for (const q of selected) {
    const a = (s.answers as Record<string, unknown>)[q.id];
    if (typeof a === "string" && q.options.some((o) => o.id === a)) answers[q.id] = a;
  }
  const keep = (map: FlagMap, needsAnswer: boolean): FlagMap =>
    Object.fromEntries(Object.keys(map).filter((id) => inSession.has(id) && (!needsAnswer || id in answers)).map((id) => [id, true as const]));
  return {
    mode: s.mode,
    instantFeedback: s.instantFeedback,
    questions: selected,
    index: s.index,
    answers,
    checked: keep(s.checked, true),
    flagged: keep(s.flagged, false),
  };
}

export function serializeSession(session: QuizSession): string {
  return JSON.stringify(session);
}

export function loadSession(bank: readonly Question[]): RestoredSession | null {
  if (typeof window === "undefined") return null;
  try { return parseSession(window.sessionStorage.getItem(SESSION_KEY), bank); } catch { return null; }
}

export function saveSession(session: QuizSession): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(SESSION_KEY, serializeSession(session)); } catch { /* storage blocked: resume is best-effort */ }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
