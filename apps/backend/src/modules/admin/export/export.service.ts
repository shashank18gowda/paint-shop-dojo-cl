import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ExcelJS from 'exceljs';
import { ReportsService } from '../reports/reports.service';
import { SessionFilters } from '../interfaces/session-filters.interface';
import { ParticipantRankingsFilters } from './export.types';

@Injectable()
export class ExportService {
  private readonly exportMaxRows: number;

  constructor(
    private reports: ReportsService,
    private config: ConfigService,
  ) {
    this.exportMaxRows = this.config.get<number>('EXPORT_MAX_ROWS', 10000);
  }

  private csvEscape(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  }

  private csvRow(values: unknown[]): string {
    return values.map((v) => this.csvEscape(v)).join(',');
  }

  private csvTable(header: string[], rows: unknown[][]): string {
    return [this.csvRow(header), ...rows.map((r) => this.csvRow(r))].join('\n');
  }

  private addSheet(
    workbook: ExcelJS.Workbook,
    name: string,
    header: string[],
    rows: unknown[][],
  ) {
    const sheet = workbook.addWorksheet(name);
    sheet.addRow(header);
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));

    sheet.columns.forEach((column, i) => {
      const headerLen = String(header[i] ?? '').length;
      const maxRowLen = rows.reduce(
        (max, row) => Math.max(max, String(row[i] ?? '').length),
        0,
      );
      column.width = Math.min(Math.max(headerLen, maxRowLen) + 2, 60);
    });
  }

  async exportSessions(filters: SessionFilters): Promise<string> {
    const { data } = await this.reports.getSessions({ ...filters, limit: this.exportMaxRows });

    const header = ['Name', 'Code', 'Designation', 'Line', 'Status', 'Score', 'Percentage', 'Duration', 'Date'];
    const rows = data.map((s) => {
      const attempt = s.attempts[0];
      return [
        s.participant.name,
        s.participant.code,
        s.participant.designation.name,
        s.participant.line.name,
        s.status,
        attempt?.score ?? '',
        attempt ? `${attempt.percentage.toFixed(1)}%` : '',
        s.durationSeconds ? `${s.durationSeconds}s` : '',
        s.startedAt.toISOString().split('T')[0],
      ];
    });

    return this.csvTable(header, rows);
  }

  async exportReportOverview(filters: {
    designation?: string;
    plant?: string;
    line?: string;
    days?: number;
    period?: string;
    from?: string;
    to?: string;
  }): Promise<ExcelJS.Buffer> {
    const report = await this.reports.getReportOverview(filters);
    const workbook = new ExcelJS.Workbook();

    this.addSheet(workbook, 'KPIs', ['Metric', 'Value'], [
      ['Total Participants', report.kpis.totalParticipants],
      ['Participants This Month', report.kpis.participantsThisMonth],
      ['Sessions Today', report.kpis.sessionsToday],
      ['Sessions Yesterday', report.kpis.sessionsYesterday],
      ['Pass Rate', `${report.kpis.passRate}%`],
      ['Pass Rate Change vs Prev Week', `${report.kpis.passRateDelta}%`],
      ['Avg Score', `${report.kpis.avgScore}%`],
      ['Avg Score Change vs Prev Week', `${report.kpis.avgScoreDelta}%`],
    ]);

    this.addSheet(
      workbook,
      'Performance Distribution',
      ['Level', 'Attempts', 'Percentage'],
      report.performanceDistribution.levels.map((l) => [l.name, l.count, `${l.pct}%`]),
    );

    const designationStats = filters.designation
      ? report.designationStats.filter((d) => d.name === filters.designation)
      : report.designationStats;
    this.addSheet(
      workbook,
      'Designation Performance',
      ['Designation', 'Participants', 'Avg Score', 'Pass Rate'],
      designationStats.map((d) => [d.name, d.participants, `${d.avgScore}%`, `${d.passRate}%`]),
    );

    this.addSheet(
      workbook,
      'Plant Performance',
      ['Plant', 'Participants', 'Avg Score', 'Pass Rate'],
      report.plantStats.map((p) => [p.name, p.participants, `${p.avgScore}%`, `${p.passRate}%`]),
    );

    this.addSheet(
      workbook,
      'Line Performance',
      ['Line', 'Code', 'Participants', 'Attempts', 'Avg Score', 'Pass Rate'],
      report.lineStats.map((l) => [l.name, l.code, l.participants, l.attempts, `${l.avgScore}%`, `${l.passRate}%`]),
    );

    this.addSheet(
      workbook,
      'Top Performers',
      ['Rank', 'Name', 'Code', 'Designation', 'Avg Score', 'Attempts'],
      report.topPerformers.map((p, i) => [i + 1, p.name, p.code, p.desg, `${p.avgScore}%`, p.attempts]),
    );

    this.addSheet(
      workbook,
      'Hardest Questions',
      ['Question', 'Type', 'Difficulty', 'Attempts', 'Correct Rate'],
      report.hardestQuestions.map((q) => [q.text, q.type, q.difficulty ?? '', q.attempts, `${q.correctRate}%`]),
    );

    return workbook.xlsx.writeBuffer();
  }

  async exportParticipantRankings(filters: ParticipantRankingsFilters): Promise<string> {
    const { data } = await this.reports.getParticipantRankings({
      ...filters,
      page: 1,
      limit: this.exportMaxRows,
    });

    const header = ['Rank', 'Name', 'Code', 'Designation', 'Line', 'Attempts', 'Avg Score', 'Best Score', 'Performance', 'Last Attempt'];
    const rows = data.map((r) => [
      r.rank,
      r.name,
      r.code,
      r.designation,
      r.line,
      r.attempts,
      `${r.avgScore}%`,
      `${r.bestScore}%`,
      r.performance,
      r.lastAttempt ? r.lastAttempt.split('T')[0] : '',
    ]);

    return this.csvTable(header, rows);
  }
}
