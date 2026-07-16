import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailDispatchHistoryQueryDto } from './dto/email-dispatch-history-query.dto';

@Injectable()
export class EmailDispatchHistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: EmailDispatchHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where = {
      ...(query.recipientId ? { recipientId: query.recipientId } : {}),
      ...(query.reportType ? { reportType: query.reportType } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.emailDispatchHistory.findMany({
        where,
        include: { recipient: { select: { id: true, email: true, name: true } } },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.emailDispatchHistory.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
