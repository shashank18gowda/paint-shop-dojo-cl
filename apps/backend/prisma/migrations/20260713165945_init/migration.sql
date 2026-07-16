-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'FAILED');

-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('QUIZ', 'GAME');

-- CreateEnum
CREATE TYPE "LeaderboardType" AS ENUM ('GLOBAL', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "LeaderboardSource" AS ENUM ('QUIZ', 'GAME');

-- CreateEnum
CREATE TYPE "GameRunStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "EmailDispatchStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('PROCESS_PICK', 'COLOUR_PICK', 'CONFIRM');

-- CreateTable
CREATE TABLE "Designation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Designation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Line" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designationId" TEXT NOT NULL,
    "participantTypeId" TEXT NOT NULL,
    "lineId" TEXT NOT NULL,
    "plantId" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "imageUrl" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "receivesDailyReport" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "difficulty" INTEGER,
    "points" INTEGER NOT NULL DEFAULT 1,
    "timeLimit" INTEGER NOT NULL DEFAULT 30,
    "type" "QuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "explanation" TEXT,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTranslation" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "QuestionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionTranslation" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "OptionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceLevel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "performanceLevelId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "pointsAwarded" DOUBLE PRECISION,
    "timeTaken" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantSession" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "kind" "SessionKind" NOT NULL DEFAULT 'QUIZ',
    "lineId" TEXT,
    "languageCode" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "isPassed" BOOLEAN,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipantSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameFlow" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsPerCorrect" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "penaltyPerWrong" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxWrongAttempts" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModel" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarColour" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarColour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModelColour" (
    "id" TEXT NOT NULL,
    "carModelId" TEXT NOT NULL,
    "carColourId" TEXT NOT NULL,
    "sortOrder" INTEGER,

    CONSTRAINT "CarModelColour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModelQuestion" (
    "id" TEXT NOT NULL,
    "carModelId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "stepNo" INTEGER NOT NULL,

    CONSTRAINT "CarModelQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameProcess" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "carVisualAfter" TEXT,
    "animationFeedback" TEXT,
    "developerNotes" TEXT,
    "imageUrl" TEXT,
    "eligibleAsDistractor" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameQuestion" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "stepNo" INTEGER NOT NULL,
    "kind" "QuestionKind" NOT NULL DEFAULT 'PROCESS_PICK',
    "questionText" TEXT NOT NULL,
    "initialVisualText" TEXT,
    "carVisualBefore" TEXT,
    "correctProcessId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameProcessTranslation" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "carVisualAfter" TEXT,
    "animationFeedback" TEXT,

    CONSTRAINT "GameProcessTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameQuestionTranslation" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "initialVisualText" TEXT,
    "carVisualBefore" TEXT,

    CONSTRAINT "GameQuestionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameProcessHint" (
    "id" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "GameProcessHint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameProcessHintTranslation" (
    "id" TEXT NOT NULL,
    "hintId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "GameProcessHintTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameJudgementBand" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minScore" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "certificateEligible" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GameJudgementBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRun" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "carModelId" TEXT,
    "carColourId" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "status" "GameRunStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "judgementBandId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "timeTaken" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRunStep" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "shownProcessIds" JSONB NOT NULL,
    "wrongAttempts" INTEGER NOT NULL DEFAULT 0,
    "pointsAwarded" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "timeTaken" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRunStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAnswerEvent" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "chosenProcessId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "hintRevealed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAnswerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderboardEntry" (
    "id" TEXT NOT NULL,
    "source" "LeaderboardSource" NOT NULL DEFAULT 'QUIZ',
    "attemptId" TEXT,
    "gameRunId" TEXT,
    "participantId" TEXT NOT NULL,
    "designationId" TEXT NOT NULL,
    "lineId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "type" "LeaderboardType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRecipient" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportAccess" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailDispatchHistory" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "reportType" "ReportType" NOT NULL,
    "status" "EmailDispatchStatus" NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailDispatchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT,
    "gameRunId" TEXT,
    "participantId" TEXT,
    "certificateNo" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participantName" TEXT NOT NULL,
    "employeeCode" TEXT NOT NULL,
    "designationName" TEXT NOT NULL,
    "lineName" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "performanceName" TEXT NOT NULL,
    "performanceColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Designation_code_key" ON "Designation"("code");

-- CreateIndex
CREATE INDEX "Designation_isActive_idx" ON "Designation"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Line_code_key" ON "Line"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Plant_code_key" ON "Plant"("code");

-- CreateIndex
CREATE INDEX "Plant_isActive_idx" ON "Plant"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Language_code_key" ON "Language"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantType_code_key" ON "ParticipantType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_code_key" ON "Participant"("code");

-- CreateIndex
CREATE INDEX "Participant_designationId_idx" ON "Participant"("designationId");

-- CreateIndex
CREATE INDEX "Participant_participantTypeId_idx" ON "Participant"("participantTypeId");

-- CreateIndex
CREATE INDEX "Participant_lineId_idx" ON "Participant"("lineId");

-- CreateIndex
CREATE INDEX "Participant_plantId_idx" ON "Participant"("plantId");

-- CreateIndex
CREATE INDEX "Participant_isActive_idx" ON "Participant"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_isActive_idx" ON "Admin"("isActive");

-- CreateIndex
CREATE INDEX "Question_isActive_idx" ON "Question"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionTranslation_questionId_languageId_key" ON "QuestionTranslation"("questionId", "languageId");

-- CreateIndex
CREATE INDEX "QuestionOption_questionId_idx" ON "QuestionOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "OptionTranslation_optionId_languageId_key" ON "OptionTranslation"("optionId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceLevel_code_key" ON "PerformanceLevel"("code");

-- CreateIndex
CREATE INDEX "PerformanceLevel_minScore_maxScore_idx" ON "PerformanceLevel"("minScore", "maxScore");

-- CreateIndex
CREATE INDEX "PerformanceLevel_isActive_idx" ON "PerformanceLevel"("isActive");

-- CreateIndex
CREATE INDEX "QuizAttempt_sessionId_idx" ON "QuizAttempt"("sessionId");

-- CreateIndex
CREATE INDEX "QuizAttempt_performanceLevelId_idx" ON "QuizAttempt"("performanceLevelId");

-- CreateIndex
CREATE INDEX "QuizAnswer_attemptId_idx" ON "QuizAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "QuizAnswer_questionId_idx" ON "QuizAnswer"("questionId");

-- CreateIndex
CREATE INDEX "ParticipantSession_participantId_idx" ON "ParticipantSession"("participantId");

-- CreateIndex
CREATE INDEX "ParticipantSession_participantId_kind_idx" ON "ParticipantSession"("participantId", "kind");

-- CreateIndex
CREATE INDEX "ParticipantSession_status_idx" ON "ParticipantSession"("status");

-- CreateIndex
CREATE INDEX "ParticipantSession_lineId_idx" ON "ParticipantSession"("lineId");

-- CreateIndex
CREATE UNIQUE INDEX "GameFlow_code_key" ON "GameFlow"("code");

-- CreateIndex
CREATE INDEX "GameFlow_isActive_idx" ON "GameFlow"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_code_key" ON "CarModel"("code");

-- CreateIndex
CREATE INDEX "CarModel_flowId_idx" ON "CarModel"("flowId");

-- CreateIndex
CREATE INDEX "CarModel_isActive_idx" ON "CarModel"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CarColour_code_key" ON "CarColour"("code");

-- CreateIndex
CREATE INDEX "CarColour_isActive_idx" ON "CarColour"("isActive");

-- CreateIndex
CREATE INDEX "CarModelColour_carModelId_idx" ON "CarModelColour"("carModelId");

-- CreateIndex
CREATE INDEX "CarModelColour_carColourId_idx" ON "CarModelColour"("carColourId");

-- CreateIndex
CREATE UNIQUE INDEX "CarModelColour_carModelId_carColourId_key" ON "CarModelColour"("carModelId", "carColourId");

-- CreateIndex
CREATE INDEX "CarModelQuestion_carModelId_idx" ON "CarModelQuestion"("carModelId");

-- CreateIndex
CREATE INDEX "CarModelQuestion_questionId_idx" ON "CarModelQuestion"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "CarModelQuestion_carModelId_stepNo_key" ON "CarModelQuestion"("carModelId", "stepNo");

-- CreateIndex
CREATE UNIQUE INDEX "CarModelQuestion_carModelId_questionId_key" ON "CarModelQuestion"("carModelId", "questionId");

-- CreateIndex
CREATE INDEX "GameProcess_flowId_idx" ON "GameProcess"("flowId");

-- CreateIndex
CREATE UNIQUE INDEX "GameProcess_flowId_code_key" ON "GameProcess"("flowId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "GameProcess_id_flowId_key" ON "GameProcess"("id", "flowId");

-- CreateIndex
CREATE INDEX "GameQuestion_flowId_idx" ON "GameQuestion"("flowId");

-- CreateIndex
CREATE INDEX "GameQuestion_correctProcessId_idx" ON "GameQuestion"("correctProcessId");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuestion_flowId_stepNo_key" ON "GameQuestion"("flowId", "stepNo");

-- CreateIndex
CREATE INDEX "GameProcessTranslation_processId_idx" ON "GameProcessTranslation"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "GameProcessTranslation_processId_languageId_key" ON "GameProcessTranslation"("processId", "languageId");

-- CreateIndex
CREATE INDEX "GameQuestionTranslation_questionId_idx" ON "GameQuestionTranslation"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuestionTranslation_questionId_languageId_key" ON "GameQuestionTranslation"("questionId", "languageId");

-- CreateIndex
CREATE INDEX "GameProcessHint_processId_idx" ON "GameProcessHint"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "GameProcessHint_processId_order_key" ON "GameProcessHint"("processId", "order");

-- CreateIndex
CREATE INDEX "GameProcessHintTranslation_hintId_idx" ON "GameProcessHintTranslation"("hintId");

-- CreateIndex
CREATE UNIQUE INDEX "GameProcessHintTranslation_hintId_languageId_key" ON "GameProcessHintTranslation"("hintId", "languageId");

-- CreateIndex
CREATE INDEX "GameJudgementBand_flowId_minScore_maxScore_idx" ON "GameJudgementBand"("flowId", "minScore", "maxScore");

-- CreateIndex
CREATE UNIQUE INDEX "GameJudgementBand_flowId_code_key" ON "GameJudgementBand"("flowId", "code");

-- CreateIndex
CREATE INDEX "GameRun_sessionId_idx" ON "GameRun"("sessionId");

-- CreateIndex
CREATE INDEX "GameRun_flowId_idx" ON "GameRun"("flowId");

-- CreateIndex
CREATE INDEX "GameRun_carModelId_idx" ON "GameRun"("carModelId");

-- CreateIndex
CREATE INDEX "GameRun_carColourId_idx" ON "GameRun"("carColourId");

-- CreateIndex
CREATE INDEX "GameRun_status_idx" ON "GameRun"("status");

-- CreateIndex
CREATE INDEX "GameRunStep_runId_idx" ON "GameRunStep"("runId");

-- CreateIndex
CREATE INDEX "GameRunStep_questionId_idx" ON "GameRunStep"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRunStep_runId_questionId_key" ON "GameRunStep"("runId", "questionId");

-- CreateIndex
CREATE INDEX "GameAnswerEvent_stepId_idx" ON "GameAnswerEvent"("stepId");

-- CreateIndex
CREATE INDEX "GameAnswerEvent_chosenProcessId_idx" ON "GameAnswerEvent"("chosenProcessId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_attemptId_key" ON "LeaderboardEntry"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_gameRunId_key" ON "LeaderboardEntry"("gameRunId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_score_idx" ON "LeaderboardEntry"("score");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_designationId_idx" ON "LeaderboardEntry"("designationId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_lineId_idx" ON "LeaderboardEntry"("lineId");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_type_idx" ON "LeaderboardEntry"("type");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_source_type_idx" ON "LeaderboardEntry"("source", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ReportRecipient_email_key" ON "ReportRecipient"("email");

-- CreateIndex
CREATE INDEX "ReportRecipient_isActive_idx" ON "ReportRecipient"("isActive");

-- CreateIndex
CREATE INDEX "ReportAccess_reportType_enabled_idx" ON "ReportAccess"("reportType", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ReportAccess_recipientId_reportType_key" ON "ReportAccess"("recipientId", "reportType");

-- CreateIndex
CREATE INDEX "EmailDispatchHistory_recipientId_reportType_sentAt_idx" ON "EmailDispatchHistory"("recipientId", "reportType", "sentAt");

-- CreateIndex
CREATE INDEX "EmailDispatchHistory_reportType_sentAt_idx" ON "EmailDispatchHistory"("reportType", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_attemptId_key" ON "Certificate"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_gameRunId_key" ON "Certificate"("gameRunId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateNo_key" ON "Certificate"("certificateNo");

-- CreateIndex
CREATE INDEX "Certificate_participantId_issuedAt_idx" ON "Certificate"("participantId", "issuedAt");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_participantTypeId_fkey" FOREIGN KEY ("participantTypeId") REFERENCES "ParticipantType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTranslation" ADD CONSTRAINT "QuestionTranslation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTranslation" ADD CONSTRAINT "QuestionTranslation_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionTranslation" ADD CONSTRAINT "OptionTranslation_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionTranslation" ADD CONSTRAINT "OptionTranslation_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParticipantSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_performanceLevelId_fkey" FOREIGN KEY ("performanceLevelId") REFERENCES "PerformanceLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAnswer" ADD CONSTRAINT "QuizAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSession" ADD CONSTRAINT "ParticipantSession_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantSession" ADD CONSTRAINT "ParticipantSession_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "GameFlow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModelColour" ADD CONSTRAINT "CarModelColour_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModelColour" ADD CONSTRAINT "CarModelColour_carColourId_fkey" FOREIGN KEY ("carColourId") REFERENCES "CarColour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModelQuestion" ADD CONSTRAINT "CarModelQuestion_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarModelQuestion" ADD CONSTRAINT "CarModelQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GameQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProcess" ADD CONSTRAINT "GameProcess_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "GameFlow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuestion" ADD CONSTRAINT "GameQuestion_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "GameFlow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuestion" ADD CONSTRAINT "GameQuestion_correctProcessId_flowId_fkey" FOREIGN KEY ("correctProcessId", "flowId") REFERENCES "GameProcess"("id", "flowId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProcessTranslation" ADD CONSTRAINT "GameProcessTranslation_processId_fkey" FOREIGN KEY ("processId") REFERENCES "GameProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProcessTranslation" ADD CONSTRAINT "GameProcessTranslation_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuestionTranslation" ADD CONSTRAINT "GameQuestionTranslation_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GameQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuestionTranslation" ADD CONSTRAINT "GameQuestionTranslation_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProcessHint" ADD CONSTRAINT "GameProcessHint_processId_fkey" FOREIGN KEY ("processId") REFERENCES "GameProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProcessHintTranslation" ADD CONSTRAINT "GameProcessHintTranslation_hintId_fkey" FOREIGN KEY ("hintId") REFERENCES "GameProcessHint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameProcessHintTranslation" ADD CONSTRAINT "GameProcessHintTranslation_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameJudgementBand" ADD CONSTRAINT "GameJudgementBand_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "GameFlow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRun" ADD CONSTRAINT "GameRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParticipantSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRun" ADD CONSTRAINT "GameRun_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "GameFlow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRun" ADD CONSTRAINT "GameRun_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRun" ADD CONSTRAINT "GameRun_carColourId_fkey" FOREIGN KEY ("carColourId") REFERENCES "CarColour"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRun" ADD CONSTRAINT "GameRun_judgementBandId_fkey" FOREIGN KEY ("judgementBandId") REFERENCES "GameJudgementBand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRunStep" ADD CONSTRAINT "GameRunStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "GameRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRunStep" ADD CONSTRAINT "GameRunStep_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GameQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAnswerEvent" ADD CONSTRAINT "GameAnswerEvent_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "GameRunStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAnswerEvent" ADD CONSTRAINT "GameAnswerEvent_chosenProcessId_fkey" FOREIGN KEY ("chosenProcessId") REFERENCES "GameProcess"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_gameRunId_fkey" FOREIGN KEY ("gameRunId") REFERENCES "GameRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAccess" ADD CONSTRAINT "ReportAccess_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "ReportRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailDispatchHistory" ADD CONSTRAINT "EmailDispatchHistory_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "ReportRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_gameRunId_fkey" FOREIGN KEY ("gameRunId") REFERENCES "GameRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
