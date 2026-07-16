import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

@Injectable()
export class DesignationService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const item = await this.prisma.designation.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Designation ${id} not found`);
    return item;
  }

  findAll() {
    return this.prisma.designation.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true },
    });
  }

  findAllAdmin() {
    return this.prisma.designation.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateDesignationDto) {
    const nameTaken = await this.prisma.designation.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (nameTaken) throw new ConflictException(`Designation with name "${dto.name}" already exists`);

    try {
      return await this.prisma.designation.create({ data: dto });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Designation with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateDesignationDto) {
    if (dto.name) {
      const nameTaken = await this.prisma.designation.findFirst({
        where: { name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
        select: { id: true },
      });
      if (nameTaken) throw new ConflictException(`Designation with name "${dto.name}" already exists`);
    }

    try {
      return await this.prisma.designation.update({ where: { id }, data: dto });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Designation with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  remove(id: string) {
    return this.prisma.designation.update({ where: { id }, data: { isActive: false } });
  }
}
