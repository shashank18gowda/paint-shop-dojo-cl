import type { Participant } from "../store/session";

export type { Participant };

export interface RegisterPayload {
  name: string;
  employeeCode: string;
  participantTypeId: string;
  designationId: string;
  lineId: string;
  plantId: string;
}

export interface LoginResult {
  token: string;
  participant: Participant;
}

export interface ParticipantStats {
  totalSessions: number;
  totalAttempts: number;
  bestScore: number;
  bestPerformance: string | null;
  lastActivity: string | null;
}
