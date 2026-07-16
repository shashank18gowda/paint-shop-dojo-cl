export interface GameEligibility {
  eligible: boolean;
  lastAttemptPassed: boolean | null;
  cooldownUntil: string | null;
  daysRemaining: number;
}
