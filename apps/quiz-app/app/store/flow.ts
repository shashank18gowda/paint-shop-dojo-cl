import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LangCode = "EN" | "KN" | "HI";

export interface QuizResult {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  performance: { name: string; color: string; code: string } | null;
  durationSeconds: number;
  isPassed: boolean;
}

export interface PendingRegistration {
  name: string;
  code: string;
  designationId: string;
  designationName: string;
}

interface FlowState {
  lang: LangCode;
  participantTypeId: string | null;
  participantTypeCode: string | null;
  selectedLineId: string | null;
  lastQuizResult: QuizResult | null;
  pendingCode: string | null;
  pendingRegistration: PendingRegistration | null;
  setLang: (lang: LangCode) => void;
  setParticipantType: (id: string, code: string) => void;
  setSelectedLine: (id: string) => void;
  setLastQuizResult: (result: QuizResult) => void;
  setPendingCode: (code: string | null) => void;
  setPendingRegistration: (data: PendingRegistration | null) => void;
  reset: () => void;
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set) => ({
      lang: "EN",
      participantTypeId: null,
      participantTypeCode: null,
      selectedLineId: null,
      lastQuizResult: null,
      pendingCode: null,
      pendingRegistration: null,
      setLang: (lang) => set({ lang }),
      setParticipantType: (participantTypeId, participantTypeCode) =>
        set({ participantTypeId, participantTypeCode }),
      setSelectedLine: (selectedLineId) => set({ selectedLineId }),
      setLastQuizResult: (lastQuizResult) => set({ lastQuizResult }),
      setPendingCode: (pendingCode) => set({ pendingCode }),
      setPendingRegistration: (pendingRegistration) => set({ pendingRegistration }),
      reset: () =>
        set({
          participantTypeId: null,
          participantTypeCode: null,
          selectedLineId: null,
          lastQuizResult: null,
          pendingCode: null,
          pendingRegistration: null,
        }),
    }),
    { name: "flow" }
  )
);
