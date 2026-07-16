// Master-data entity types — mirror backend Prisma models.

export interface Language {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Line {
  id: string;
  code: string;
  name: string;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Designation {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantType {
  id: string;
  code: string;
  name: string;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Plant {
  id: string;
  code: string;
  name: string;
  location: string | null;
  description: string | null;
  sortOrder: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportAccessSummary {
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
}

export interface ReportRecipient {
  id: string;
  email: string;
  name: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  reportAccess: ReportAccessSummary;
}

export type ReportType = "DAILY" | "WEEKLY" | "MONTHLY";
export type EmailDispatchStatus = "SUCCESS" | "FAILED";

export interface EmailDispatchHistoryEntry {
  id: string;
  recipientId: string;
  reportType: ReportType;
  status: EmailDispatchStatus;
  error: string | null;
  sentAt: string;
  recipient: {
    id: string;
    email: string;
    name: string | null;
  };
}

export interface EmailDispatchHistoryResult {
  data: EmailDispatchHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface ParticipantRef {
  id: string;
  code: string;
  name: string;
}

export interface Participant {
  id: string;
  code: string;
  name: string;
  designationId: string;
  designation: ParticipantRef;
  participantTypeId: string;
  participantType: ParticipantRef;
  lineId: string;
  plantId: string;
  plant: ParticipantRef;
  line: ParticipantRef;
  role: string;
  imageUrl: string | null;
  enteredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedParticipants {
  data: Participant[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedCertificates {
  data: ParticipantCertificate[];
  total: number;
  page: number;
  limit: number;
  validCount: number;
  issuedThisMonth: number;
  designationOptions: string[];
  statusOptions: string[];
}

export interface ParticipantStats {
  totalSessions: number;
  totalAttempts: number;
  bestScore: number;
  bestPerformance: string | null;
  lastActivity: string | null;
}

export interface SessionAttempt {
  sessionId: string;
  attemptId: string | null;
  completedAt: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number | null;
  isPassed: boolean;
  performance: { name: string; color: string; code: string } | null;
}

export interface AttemptQuestion {
  number: number;
  questionId: string;
  questionText: string;
  isCorrect: boolean;
  timeTaken: number | null;
  yourAnswer: string;
  correctAnswer: string;
  explanation?: string | null;
}

export interface AttemptReview {
  attemptId: string;
  completedAt: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number | null;
  isPassed: boolean;
  performance: { name: string; color: string; code: string } | null;
  questions: AttemptQuestion[];
}

export interface ParticipantCertificate {
  id: string;
  attemptId: string;
  participantId?: string | null;
  certificateNo: string;
  issuedAt: string;
  participantName: string;
  employeeCode: string;
  designationName: string;
  lineName: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  performanceName: string;
  performanceColor: string | null;
  // pdfUrl: string | null;
}
