import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

@Injectable()
export class PlantService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const item = await this.prisma.plant.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Plant ${id} not found`);
    return item;
  }

  findAll() {
    return this.prisma.plant.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, location: true },
    });
  }

  findAllAdmin() {
    return this.prisma.plant.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreatePlantDto) {
    const nameTaken = await this.prisma.plant.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (nameTaken) throw new ConflictException(`Plant with name "${dto.name}" already exists`);

    try {
      return await this.prisma.plant.create({ data: dto });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Plant with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdatePlantDto) {
    if (dto.name) {
      const nameTaken = await this.prisma.plant.findFirst({
        where: { name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
        select: { id: true },
      });
      if (nameTaken) throw new ConflictException(`Plant with name "${dto.name}" already exists`);
    }

    try {
      return await this.prisma.plant.update({ where: { id }, data: dto });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Plant with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  remove(id: string) {
    return this.prisma.plant.update({ where: { id }, data: { isActive: false } });
  }
}
