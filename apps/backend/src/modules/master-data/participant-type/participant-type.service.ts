import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateParticipantTypeDto } from './dto/create-participant-type.dto';
import { UpdateParticipantTypeDto } from './dto/update-participant-type.dto';

@Injectable()
export class ParticipantTypeService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const item = await this.prisma.participantType.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`ParticipantType ${id} not found`);
    return item;
  }

  findAll() {
    return this.prisma.participantType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.participantType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateParticipantTypeDto) {
    const nameTaken = await this.prisma.participantType.findFirst({
      where: { name: { equals: dto.name, mode: 'insensitive' } },
      select: { id: true },
    });
    if (nameTaken) throw new ConflictException(`Participant type with name "${dto.name}" already exists`);

    try {
      return await this.prisma.participantType.create({ data: dto });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Participant type with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateParticipantTypeDto) {
    if (dto.name) {
      const nameTaken = await this.prisma.participantType.findFirst({
        where: { name: { equals: dto.name, mode: 'insensitive' }, NOT: { id } },
        select: { id: true },
      });
      if (nameTaken) throw new ConflictException(`Participant type with name "${dto.name}" already exists`);
    }

    try {
      return await this.prisma.participantType.update({ where: { id }, data: dto });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException(`Participant type with code "${dto.code}" already exists`);
      }
      throw e;
    }
  }

  remove(id: string) {
    return this.prisma.participantType.update({ where: { id }, data: { isActive: false } });
  }
}
