import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ReportType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReportRecipientDto } from './dto/create-report-recipient.dto';
import { UpdateReportRecipientDto } from './dto/update-report-recipient.dto';
import { UpdateReportAccessDto } from './dto/update-report-access.dto';

export interface ReportAccessSummary {
  daily: boolean;
  weekly: boolean;
  monthly: boolean;
}

const EMPTY_ACCESS: ReportAccessSummary = { daily: false, weekly: false, monthly: false };

function toAccessSummary(reportAccess: { reportType: ReportType; enabled: boolean }[]): ReportAccessSummary {
  const map = new Map(reportAccess.map((a) => [a.reportType, a.enabled]));
  return {
    daily: map.get('DAILY') ?? false,
    weekly: map.get('WEEKLY') ?? false,
    monthly: map.get('MONTHLY') ?? false,
  };
}

@Injectable()
export class ReportRecipientService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.reportRecipient.findMany({
      orderBy: [{ createdAt: 'asc' }],
      include: { reportAccess: true },
    });
    return items.map(({ reportAccess, ...r }) => ({ ...r, reportAccess: toAccessSummary(reportAccess) }));
  }

  async findOne(id: string) {
    const item = await this.prisma.reportRecipient.findUnique({
      where: { id },
      include: { reportAccess: true },
    });
    if (!item) throw new NotFoundException(`Report recipient ${id} not found`);
    const { reportAccess, ...r } = item;
    return { ...r, reportAccess: toAccessSummary(reportAccess) };
  }

  async create(dto: CreateReportRecipientDto) {
    const emailTaken = await this.prisma.reportRecipient.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
      select: { id: true },
    });
    if (emailTaken) throw new ConflictException(`A recipient with email "${dto.email}" already exists`);

    const created = await this.prisma.reportRecipient.create({ data: dto });
    return { ...created, reportAccess: EMPTY_ACCESS };
  }

  async update(id: string, dto: UpdateReportRecipientDto) {
    if (dto.email) {
      const emailTaken = await this.prisma.reportRecipient.findFirst({
        where: { email: { equals: dto.email, mode: 'insensitive' }, NOT: { id } },
        select: { id: true },
      });
      if (emailTaken) throw new ConflictException(`A recipient with email "${dto.email}" already exists`);
    }

    await this.findOne(id);
    await this.prisma.reportRecipient.update({ where: { id }, data: dto });
    return this.findOne(id);
  }

  // Soft delete: keeps dispatch history intact, just stops future report emails
  // (the scheduler already filters on isActive) and the row drops out of the
  // "active recipients" count.
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.reportRecipient.update({ where: { id }, data: { isActive: false } });
    return this.findOne(id);
  }

  async updateAccess(id: string, dto: UpdateReportAccessDto) {
    await this.findOne(id);

    const updates: { reportType: ReportType; enabled: boolean }[] = [];
    if (dto.daily !== undefined) updates.push({ reportType: 'DAILY', enabled: dto.daily });
    if (dto.weekly !== undefined) updates.push({ reportType: 'WEEKLY', enabled: dto.weekly });
    if (dto.monthly !== undefined) updates.push({ reportType: 'MONTHLY', enabled: dto.monthly });

    if (updates.length > 0) {
      await this.prisma.$transaction(
        updates.map((u) =>
          this.prisma.reportAccess.upsert({
            where: { recipientId_reportType: { recipientId: id, reportType: u.reportType } },
            create: { recipientId: id, reportType: u.reportType, enabled: u.enabled },
            update: { enabled: u.enabled },
          }),
        ),
      );
    }

    return this.findOne(id);
  }
}
