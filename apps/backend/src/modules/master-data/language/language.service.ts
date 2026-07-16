import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Injectable()
export class LanguageService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const item = await this.prisma.language.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Language ${id} not found`);
    return item;
  }

  findAll() {
    return this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.language.findMany({ orderBy: { code: 'asc' } });
  }

  async create(dto: CreateLanguageDto) {
    try {
      return await this.prisma.language.create({
        data: { ...dto, code: dto.code.trim().toUpperCase() },
      });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Language with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateLanguageDto) {
    try {
      return await this.prisma.language.update({
        where: { id },
        data: { ...dto, ...(dto.code !== undefined ? { code: dto.code.trim().toUpperCase() } : {}) },
      });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Language with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  remove(id: string) {
    return this.prisma.language.update({ where: { id }, data: { isActive: false } });
  }
}
