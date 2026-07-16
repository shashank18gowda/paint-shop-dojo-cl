export const DEFAULT_PAGE_SIZE = 20;
export const LEADERBOARD_DEFAULT_LIMIT = 10;
export const QUIZ_DEFAULT_QUESTION_COUNT = 10;
export const QUIZ_MIN_QUESTION_COUNT = 5;
export const QUIZ_MAX_QUESTION_COUNT = 50;
export const QUIZ_COOLDOWN_PASS_DAYS = 365;
export const QUIZ_COOLDOWN_FAIL_DAYS = 30;
export const GAME_COOLDOWN_PASS_DAYS = 365;
export const GAME_COOLDOWN_FAIL_DAYS = 30;
// How long an IN_PROGRESS quiz session can sit idle before the sweep marks it
// ABANDONED. Generous by design — the per-question timers auto-submit a live
// tab, so anything still IN_PROGRESS past this window is a dead/closed client.
export const QUIZ_SESSION_TTL_MINUTES = 30;
