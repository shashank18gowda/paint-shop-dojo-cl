import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePerformanceLevelDto } from './dto/create-performance-level.dto';
import { UpdatePerformanceLevelDto } from './dto/update-performance-level.dto';

@Injectable()
export class PerformanceLevelService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.performanceLevel.findMany({
      where: { isActive: true },
      orderBy: { minScore: 'asc' },
    });
  }

  async create(dto: CreatePerformanceLevelDto) {
    try {
      return await this.prisma.performanceLevel.create({
        data: dto,
      });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Performance level with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdatePerformanceLevelDto) {
    try {
      return await this.prisma.performanceLevel.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Performance level update conflicts with an existing record`);
      }
      throw e;
    }
  }

  // Soft delete: QuizAttempt rows keep their performanceLevelId FK reference
  // (and historical reports keep showing the band name) after removal.
  remove(id: string) {
    return this.prisma.performanceLevel.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
