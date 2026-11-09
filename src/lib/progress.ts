import type { QuizScore } from "./quiz";

export const PROGRESS_KEY = "roadready7.progress.v1";
export type SavedAttempt = {
  id: string;
  completedAt: string;
  score: QuizScore;
};

export function loadAttempts(): SavedAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is SavedAttempt => {
      if (!entry || typeof entry !== "object") return false;
      const a = entry as Partial<SavedAttempt>;
      return typeof a.id === "string" && typeof a.completedAt === "string" && !!a.score && typeof a.score.correct === "number" && typeof a.score.total === "number";
    }).slice(0, 100);
  } catch { return []; }
}

export function saveAttempt(attempt: SavedAttempt): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify([attempt, ...loadAttempts()].slice(0, 100)));
    return true;
  } catch { return false; }
}

/** Create and persist an attempt only when the learner submits a quiz. */
export function saveCompletedAttempt(score: QuizScore): boolean {
  return saveAttempt({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    completedAt: new Date().toISOString(),
    score,
  });
}
