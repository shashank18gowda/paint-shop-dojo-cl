import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { ExportService } from '../export/export.service';
import { BrevoEmailService } from '../../email/brevo-email.service';

const IST_TIMEZONE = 'Asia/Kolkata';

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

export interface ReportDispatchSummary {
  reportType: ReportType;
  recipients: number;
  sent: number;
  skipped: number;
  failed: number;
}

@Injectable()
export class ReportSchedulerService {
  private readonly logger = new Logger(ReportSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private reports: ReportsService,
    private exportService: ExportService,
    private email: BrevoEmailService,
  ) {}

  // 09:00 IST every day
  // @Cron('07 17 * * *', { name: 'daily-report', timeZone: IST_TIMEZONE })
  @Cron('0 9 * * *', { name: 'daily-report', timeZone: IST_TIMEZONE })
  handleDailyReport() {
    return this.dispatchReport('DAILY');
  }

  // 09:00 IST every Monday
  // @Cron('12 17 * * 3', { name: 'weekly-report', timeZone: IST_TIMEZONE })
  @Cron('0 9 * * 1', { name: 'weekly-report', timeZone: IST_TIMEZONE })
  
  handleWeeklyReport() {
    return this.dispatchReport('WEEKLY');
  }

  // 09:00 IST on the 1st of every month
  // @Cron('0 9 1 * *', { name: 'monthly-report', timeZone: IST_TIMEZONE })
   @Cron('17 17 17 * *', { name: 'monthly-report', timeZone: IST_TIMEZONE })
 handleMonthlyReport() {
    return this.dispatchReport('MONTHLY');
  }

  async dispatchReport(reportType: ReportType): Promise<ReportDispatchSummary> {
    this.logger.log(`Starting ${reportType} report dispatch`);

    const recipients = await this.prisma.reportRecipient.findMany({
      where: {
        isActive: true,
        reportAccess: { some: { reportType, enabled: true } },
      },
    });

    if (recipients.length === 0) {
      this.logger.log(
        `${reportType} report dispatch: no active recipients have this report enabled`,
      );
      return { reportType, recipients: 0, sent: 0, skipped: 0, failed: 0 };
    }

    const [report, xlsxBuffer] = await Promise.all([
      this.reports.getReportOverview({ period: reportType }),
      this.exportService.exportReportOverview({ period: reportType }),
    ]);

    const html = this.buildEmailHtml(reportType, report);
    const attachmentName = `report-${reportType.toLowerCase()}-${this.formatDate(new Date())}.xlsx`;
    const attachmentContent = Buffer.from(xlsxBuffer);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const alreadySent = await this.alreadySentInWindow(
        recipient.id,
        reportType,
      );
      if (alreadySent) {
        skipped += 1;
        this.logger.log(
          `${reportType} report: skipping ${recipient.email} — already sent in this period`,
        );
        continue;
      }

      const result = await this.email.sendEmail({
        to: [{ email: recipient.email, name: recipient.name ?? undefined }],
        subject: `${REPORT_TYPE_LABELS[reportType]} Training Report — ${this.formatDate(new Date())}`,
        html,
        attachments: [{ filename: attachmentName, content: attachmentContent }],
      });

      await this.prisma.emailDispatchHistory.create({
        data: {
          recipientId: recipient.id,
          reportType,
          status: result.success ? 'SUCCESS' : 'FAILED',
          error: result.error,
        },
      });

      if (result.success) {
        sent += 1;
        this.logger.log(`${reportType} report sent to ${recipient.email}`);
      } else {
        failed += 1;
        this.logger.error(
          `${reportType} report failed for ${recipient.email}: ${result.error}`,
        );
      }
    }

    this.logger.log(
      `${reportType} report dispatch complete: ${sent} sent, ${skipped} skipped, ${failed} failed (of ${recipients.length} recipients)`,
    );
    return { reportType, recipients: recipients.length, sent, skipped, failed };
  }

  // A recipient should only get one successful send per reporting period —
  // guards against the cron firing twice (restarts) or a manual re-trigger.
  private async alreadySentInWindow(
    recipientId: string,
    reportType: ReportType,
  ): Promise<boolean> {
    const since = this.windowStart(reportType);
    const existing = await this.prisma.emailDispatchHistory.findFirst({
      where: {
        recipientId,
        reportType,
        status: 'SUCCESS',
        sentAt: { gte: since },
      },
      select: { id: true },
    });
    return !!existing;
  }

  private windowStart(reportType: ReportType): Date {
    const now = new Date();
    if (reportType === 'DAILY') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (reportType === 'WEEKLY') {
      const day = now.getDay(); // 0 = Sunday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + diffToMonday,
      );
      return monday;
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private buildEmailHtml(
    reportType: ReportType,
    report: Awaited<ReturnType<ReportsService['getReportOverview']>>,
  ): string {
    const { kpis } = report;
    const label = REPORT_TYPE_LABELS[reportType];
    return `
      <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px;">
        <h2 style="color: #EB0A1E; margin-bottom: 4px;">${label} Training Report</h2>
        <p style="margin-top: 0; color: #4b5563;">
          Here's the ${label.toLowerCase()} summary for the Paint Shop training program.
          The full breakdown (KPIs, performance distribution, designation/plant/line performance,
          top performers and hardest questions) is attached as an Excel workbook.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
          <tbody>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Total Participants</td>
              <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">${kpis.totalParticipants}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Sessions Today</td>
              <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">${kpis.sessionsToday}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Pass Rate</td>
              <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">${kpis.passRate}%</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Average Score</td>
              <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600;">${kpis.avgScore}%</td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
          This is an automated message from Paint Shop Dojo. Please do not reply to this email.
        </p>
      </div>
    `;
  }
}
