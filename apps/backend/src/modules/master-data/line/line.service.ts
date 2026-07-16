import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLineDto } from './dto/create-line.dto';
import { UpdateLineDto } from './dto/update-line.dto';

@Injectable()
export class LineService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.line.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.line.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateLineDto) {
    const nameTaken = await this.prisma.line.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (nameTaken) throw new ConflictException(`Line with name "${dto.name}" already exists`);

    try {
      return await this.prisma.line.create({ data: dto });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Line with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateLineDto) {
    if (dto.name) {
      const nameTaken = await this.prisma.line.findFirst({
        where: { name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
        select: { id: true },
      });
      if (nameTaken) throw new ConflictException(`Line with name "${dto.name}" already exists`);
    }

    try {
      return await this.prisma.line.update({ where: { id }, data: dto });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Line with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  remove(id: string) {
    return this.prisma.line.update({ where: { id }, data: { isActive: false } });
  }
}
