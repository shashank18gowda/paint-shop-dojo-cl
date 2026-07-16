import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function setTestPrisma(client: PrismaClient) {
  prisma = client;
}


export async function truncateAll() {
  // Delete in reverse-dependency order to respect FK constraints
  await prisma.gameSession.deleteMany();
  await prisma.gameStage.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.participantSession.deleteMany();
  await prisma.optionTranslation.deleteMany();
  await prisma.questionTranslation.deleteMany();
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.performanceLevel.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.participantType.deleteMany();
  await prisma.language.deleteMany();
  await prisma.line.deleteMany();
  await prisma.designation.deleteMany();
}

export async function seedBaseData() {
  const designation = await prisma.designation.create({
    data: { code: 'PAINT', name: 'Paint Shop', isActive: true, sortOrder: 1 },
  });

  const line = await prisma.line.create({
    data: { code: 'LINE-A', name: 'Assembly Line A', isActive: true, sortOrder: 1 },
  });

  const language = await prisma.language.create({
    data: { code: 'EN', name: 'English', isActive: true },
  });

  const participantType = await prisma.participantType.create({
    data: { code: 'OPERATOR', name: 'Operator', isActive: true, sortOrder: 1 },
  });

  await prisma.performanceLevel.createMany({
    data: [
      { code: 'NEEDS_IMPROVEMENT', name: 'Needs Improvement', minScore: 0, maxScore: 49, color: '#ff4444' },
      { code: 'GOOD', name: 'Good', minScore: 50, maxScore: 75, color: '#44aa44' },
      { code: 'EXCELLENT', name: 'Excellent', minScore: 76, maxScore: 100, color: '#4444ff' },
    ],
  });

  const userParticipant = await prisma.participant.create({
    data: {
      code: 'EMP001',
      name: 'Test User',
      designationId: designation.id,
      lineId: line.id,
      participantTypeId: participantType.id,
      role: 'USER',
    },
  });

  const adminParticipant = await prisma.participant.create({
    data: {
      code: 'ADMIN001',
      name: 'Test Admin',
      designationId: designation.id,
      lineId: line.id,
      participantTypeId: participantType.id,
      role: 'ADMIN',
    },
  });

  // 5 questions with EN translations and 2 options each
  const questions = await Promise.all(
    Array.from({ length: 5 }, async (_, i) => {
      const question = await prisma.question.create({
        data: {
          isActive: true,
          points: 10,
          timeLimit: 30,
          type: 'SINGLE_CHOICE',
          shuffleOptions: false,
          translations: {
            create: [{ languageId: language.id, text: `Question ${i + 1}: Paint shop step?` }],
          },
          options: {
            create: [
              { isCorrect: true, order: 1 },
              { isCorrect: false, order: 2 },
            ],
          },
        },
        include: { options: true },
      });

      // Add translations to each option
      for (const option of question.options) {
        await prisma.optionTranslation.create({
          data: {
            optionId: option.id,
            languageId: language.id,
            text: option.isCorrect ? 'Correct Answer' : 'Wrong Answer',
          },
        });
      }

      return question;
    }),
  );

  return { designation, line, language, participantType, userParticipant, adminParticipant, questions };
}

export async function disconnectDb() {
  await prisma.$disconnect();
}
