import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const participant = await this.prisma.participant.findUnique({
      where: { code: dto.employeeCode },
      include: { designation: true, line: true, participantType: true, plant: true },
    });

    if (!participant || !participant.isActive) {
      this.logger.warn(`Failed login attempt for employee code: ${dto.employeeCode}`);
      throw new NotFoundException(`Employee code "${dto.employeeCode}" not found`);
    }

    this.logger.log(`Participant logged in: ${participant.code} (${participant.id})`);

    const payload = {
      sub: participant.id,
      kind: 'participant' as const,
      code: participant.code,
      designationId: participant.designationId,
    };

    const token = await this.jwt.signAsync(payload);

    return {
      token,
      participant: {
        id: participant.id,
        name: participant.name,
        code: participant.code,
        designation: participant.designation.name,
        line: participant.line.name,
        type: participant.participantType.name,
        plant: participant.plant?.name,
        imageUrl: participant.imageUrl,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.participant.findUnique({
      where: { code: dto.employeeCode },
    });
    if (existing) {
      throw new ConflictException(`Employee code "${dto.employeeCode}" is already registered`);
    }

    const participant = await this.prisma.participant.create({
      data: {
        code: dto.employeeCode,
        name: dto.name,
        participantTypeId: dto.participantTypeId,
        designationId: dto.designationId,
        lineId: dto.lineId,
        plantId: dto.plantId,
      },
      include: { designation: true, line: true, participantType: true, plant: true },
    });

    this.logger.log(`New participant registered: ${participant.code} (${participant.id})`);

    const payload = {
      sub: participant.id,
      kind: 'participant' as const,
      code: participant.code,
      designationId: participant.designationId,
    };
    const token = await this.jwt.signAsync(payload);

    return {
      token,
      participant: {
        id: participant.id,
        name: participant.name,
        code: participant.code,
        designation: participant.designation.name,
        line: participant.line.name,
        type: participant.participantType.name,
        plant: participant.plant?.name,
        imageUrl: participant.imageUrl,
      },
    };
  }

  async getMe(participantId: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: { designation: true, line: true, participantType: true, plant: true },
    });
    if (!participant || !participant.isActive) {
      throw new NotFoundException(`Participant "${participantId}" not found`);
    }
    return {
      id: participant.id,
      name: participant.name,
      code: participant.code,
      designation: participant.designation.name,
      designationId: participant.designationId,
      line: participant.line.name,
      lineId: participant.lineId,
      type: participant.participantType.name,
      plant: participant.plant?.name,
      imageUrl: participant.imageUrl,
    };
  }
}
