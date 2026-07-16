import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

const QUESTION_INCLUDE = {
  translations: { include: { language: { select: { id: true, code: true } } } },
  options: {
    include: {
      translations: { include: { language: { select: { id: true, code: true } } } },
    },
    orderBy: { order: 'asc' as const },
  },
} as const;

@Injectable()
export class QuestionsAdminService {
  constructor(private prisma: PrismaService) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(
    page = 1,
    limit = 20,
    search?: string,
    type?: string,
    difficulty?: number,
    isActive?: boolean,
    langCode?: string,
  ) {
    const conditions: object[] = [];

    if (type) conditions.push({ type });
    if (difficulty) conditions.push({ difficulty });
    if (isActive !== undefined) conditions.push({ isActive });

    if (search) {
      conditions.push({
        translations: {
          some: { text: { contains: search, mode: 'insensitive' } },
        },
      });
    }

    if (langCode) {
      // Case-insensitive match on language code
      conditions.push({
        translations: {
          some: {
            language: { code: { equals: langCode, mode: 'insensitive' } },
          },
        },
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          translations: {
            include: { language: { select: { code: true } } },
          },
          _count: { select: { options: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      data: questions.map((q) => ({
        id: q.id,
        type: q.type,
        difficulty: q.difficulty,
        points: q.points,
        timeLimit: q.timeLimit,
        isActive: q.isActive,
        shuffleOptions: q.shuffleOptions,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        // Always return lowercase codes so the frontend is consistent
        langs: [...new Set(q.translations.map((t) => t.language.code.toLowerCase()))],
        optionsCount: q._count.options,
        // Case-insensitive match for English
        englishText:
          q.translations.find((t) => t.language.code.toLowerCase() === 'en')?.text ?? null,
      })),
      total,
      page,
      limit,
    };
  }

  // ── Get one (full detail for editor) ─────────────────────────────────────

  async findOne(id: string) {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: QUESTION_INCLUDE,
    });
    if (!q) throw new NotFoundException(`Question ${id} not found`);
    return this.mapDetail(q);
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateQuestionDto) {
    this.validateQuestionLogic(dto.type, dto.translations, dto.options);

    const langMap = await this.resolveLangMap([
      ...dto.translations.map((t) => t.languageCode),
      ...dto.options.flatMap((o) => o.translations.map((t) => t.languageCode)),
    ]);

    if (langMap.size === 0) {
      throw new BadRequestException(
        'No matching languages found. Make sure languages are created in the system.',
      );
    }

    const q = await this.prisma.question.create({
      data: {
        type: dto.type as any,
        difficulty: dto.difficulty,
        points: dto.points ?? 1,
        timeLimit: dto.timeLimit ?? 30,
        shuffleOptions: dto.shuffleOptions ?? true,
        isActive: dto.isActive ?? true,
        explanation: dto.explanation,
        translations: {
          create: dto.translations
            .filter((t) => langMap.has(t.languageCode.toLowerCase()))
            .map((t) => ({
              languageId: langMap.get(t.languageCode.toLowerCase())!,
              text: t.text,
            })),
        },
        options: {
          create: dto.options.map((opt, idx) => ({
            isCorrect: opt.isCorrect,
            order: opt.order ?? idx,
            translations: {
              create: opt.translations
                .filter((t) => langMap.has(t.languageCode.toLowerCase()))
                .map((t) => ({
                  languageId: langMap.get(t.languageCode.toLowerCase())!,
                  text: t.text,
                })),
            },
          })),
        },
      },
      include: QUESTION_INCLUDE,
    });

    return this.mapDetail(q);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateQuestionDto) {
    await this.findOne(id);

    const effectiveType =
      dto.type ??
      (await this.prisma.question.findUnique({ where: { id }, select: { type: true } }))!.type;

    if (dto.translations || dto.options) {
      this.validateQuestionLogic(effectiveType, dto.translations, dto.options);
    }

    const allCodes = [
      ...(dto.translations ?? []).map((t) => t.languageCode),
      ...(dto.options ?? []).flatMap((o) => o.translations.map((t) => t.languageCode)),
    ];
    const langMap = await this.resolveLangMap(allCodes);

    return this.prisma.$transaction(async (tx) => {
      await tx.question.update({
        where: { id },
        data: {
          ...(dto.type !== undefined ? { type: dto.type as any } : {}),
          ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
          ...(dto.points !== undefined ? { points: dto.points } : {}),
          ...(dto.timeLimit !== undefined ? { timeLimit: dto.timeLimit } : {}),
          ...(dto.shuffleOptions !== undefined ? { shuffleOptions: dto.shuffleOptions } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.explanation !== undefined ? { explanation: dto.explanation } : {}),
        },
      });

      if (dto.translations !== undefined) {
        await tx.questionTranslation.deleteMany({ where: { questionId: id } });
        if (dto.translations.length > 0 && langMap.size > 0) {
          await tx.questionTranslation.createMany({
            data: dto.translations
              .filter((t) => langMap.has(t.languageCode.toLowerCase()))
              .map((t) => ({
                questionId: id,
                languageId: langMap.get(t.languageCode.toLowerCase())!,
                text: t.text,
              })),
          });
        }
      }

      if (dto.options !== undefined) {
        const existingOptions = await tx.questionOption.findMany({
          where: { questionId: id },
          select: { id: true },
          orderBy: { order: 'asc' },
        });

        // Check if any existing option is referenced by QuizAnswer records.
        // If so we cannot delete those options — update them in-place instead.
        const answeredOptionIds = new Set(
          existingOptions.length > 0
            ? (
                await tx.quizAnswer.findMany({
                  where: { optionId: { in: existingOptions.map((o) => o.id) } },
                  select: { optionId: true },
                })
              ).map((a) => a.optionId)
            : [],
        );

        if (answeredOptionIds.size > 0) {
          // ── In-place update (options have quiz history) ──────────────────
          // We cannot change the number of options since that would require
          // deleting options that QuizAnswer still references.
          if (existingOptions.length !== dto.options.length) {
            throw new BadRequestException(
              `Cannot add or remove options for a question that already has ${answeredOptionIds.size} recorded quiz answer(s). ` +
                'You can update option text and which answer is correct, but the number of options must stay the same.',
            );
          }

          // Update each option at its current position
          for (const [idx, opt] of dto.options.entries()) {
            const existingOpt = existingOptions[idx];
            if (!existingOpt) continue;

            await tx.questionOption.update({
              where: { id: existingOpt.id },
              data: { isCorrect: opt.isCorrect, order: opt.order ?? idx },
            });

            // Safely replace option translations (no FK from QuizAnswer to OptionTranslation)
            await tx.optionTranslation.deleteMany({ where: { optionId: existingOpt.id } });
            if (opt.translations.length > 0 && langMap.size > 0) {
              await tx.optionTranslation.createMany({
                data: opt.translations
                  .filter((t) => langMap.has(t.languageCode.toLowerCase()))
                  .map((t) => ({
                    optionId: existingOpt.id,
                    languageId: langMap.get(t.languageCode.toLowerCase())!,
                    text: t.text,
                  })),
              });
            }
          }
        } else {
          // ── Full replace (no quiz history yet) ───────────────────────────
          await tx.optionTranslation.deleteMany({
            where: { optionId: { in: existingOptions.map((o) => o.id) } },
          });
          await tx.questionOption.deleteMany({ where: { questionId: id } });

          for (const [idx, opt] of dto.options.entries()) {
            await tx.questionOption.create({
              data: {
                questionId: id,
                isCorrect: opt.isCorrect,
                order: opt.order ?? idx,
                translations: {
                  create: opt.translations
                    .filter((t) => langMap.has(t.languageCode.toLowerCase()))
                    .map((t) => ({
                      languageId: langMap.get(t.languageCode.toLowerCase())!,
                      text: t.text,
                    })),
                },
              },
            });
          }
        }
      }

      const updated = await tx.question.findUnique({
        where: { id },
        include: QUESTION_INCLUDE,
      });
      return this.mapDetail(updated!);
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  // Soft delete: keeps the question (and any recorded answers referencing it)
  // intact for historical attempt review, just excludes it from the live quiz pool.
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.question.update({ where: { id }, data: { isActive: false } });
    return { deleted: true };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Resolves an array of language codes (any case) to a Map<lowercase_code, languageId>.
   * Uses case-insensitive DB lookup so 'en', 'EN', 'En' all resolve to the same record.
   */
  private async resolveLangMap(codes: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(codes.map((c) => c.toLowerCase()))];
    if (unique.length === 0) return new Map();

    // Use case-insensitive OR conditions
    const langs = await this.prisma.language.findMany({
      where: {
        OR: unique.map((c) => ({
          code: { equals: c, mode: 'insensitive' as const },
        })),
      },
      select: { id: true, code: true },
    });

    // Map lowercase → id, so callers can look up with lowercased code
    return new Map(langs.map((l) => [l.code.toLowerCase(), l.id]));
  }

  private validateQuestionLogic(
    type: string,
    translations?: Array<{ languageCode: string; text: string }>,
    options?: Array<{ isCorrect: boolean; translations: Array<{ languageCode: string; text: string }> }>,
  ) {
    if (translations !== undefined) {
      const hasEn = translations.some(
        (t) => t.languageCode.toLowerCase() === 'en' && t.text.trim(),
      );
      if (!hasEn) {
        throw new BadRequestException('English question text is required');
      }
    }

    if (options !== undefined) {
      if (options.length < 2) {
        throw new BadRequestException('At least 2 answer options are required');
      }
      const correctCount = options.filter((o) => o.isCorrect).length;
      if (correctCount === 0) {
        throw new BadRequestException('At least one option must be marked as correct');
      }
      if (
        (type === 'SINGLE_CHOICE' || type === 'TRUE_FALSE') &&
        correctCount !== 1
      ) {
        throw new BadRequestException(
          `${type === 'SINGLE_CHOICE' ? 'Single Choice' : 'True/False'} questions must have exactly one correct answer`,
        );
      }
    }
  }

  private mapDetail(q: any) {
    return {
      id: q.id,
      type: q.type,
      difficulty: q.difficulty,
      points: q.points,
      timeLimit: q.timeLimit,
      isActive: q.isActive,
      shuffleOptions: q.shuffleOptions,
      explanation: q.explanation,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      // Always return lowercase codes for consistency
      translations: q.translations.map((t: any) => ({
        languageCode: t.language.code.toLowerCase(),
        text: t.text,
      })),
      options: q.options.map((o: any) => ({
        id: o.id,
        isCorrect: o.isCorrect,
        order: o.order ?? 0,
        translations: o.translations.map((t: any) => ({
          languageCode: t.language.code.toLowerCase(),
          text: t.text,
        })),
      })),
    };
  }
}
