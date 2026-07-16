import type { FilterType } from "../types/api.types";

export const QUERY_KEYS = {
  languages:        ["languages"]         as const,
  lines:            ["lines"]             as const,
  participantTypes: ["participant-types"] as const,
  designations:     ["designations"]      as const,
  plants:           ["plants"]            as const,
  leaderboard:    (type: FilterType) => ["leaderboard", type] as const,
  certificate:    (attemptId: string) => ["certificate", attemptId] as const,
  attemptHistory: (sort: string)        => ["attempt-history", sort] as const,
  quizEligibility:  ["quiz-eligibility"] as const,
  gameEligibility:  ["game-eligibility"] as const,
  quizSession:    (mountId: string)      => ["quiz-session", mountId] as const,
  attemptReview:     (attemptId: string) => ["attempt-review", attemptId] as const,
  participantStats:  (code: string)      => ["participant-stats", code]   as const,
} as const;

