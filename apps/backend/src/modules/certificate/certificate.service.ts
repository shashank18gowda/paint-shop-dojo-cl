import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { randomUUID } from 'crypto';
import * as path from 'path';

type CertRecord = {
  id: string;
  participantName: string;
  employeeCode: string;
  designationName: string;
  lineName: string | null;
  score: number;
  maxScore: number;
  percentage: number;
  performanceName: string;
  performanceColor: string | null;
  certificateNo: string;
  issuedAt: Date;
  // pdfUrl: string | null;
};

@Injectable()
export class CertificateService {
  private readonly certPrefix: string;

  private readonly assetsDir: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.certPrefix = this.config.get<string>('CERT_NUMBER_PREFIX', 'TKM-PS');
    this.assetsDir = path.join(process.cwd(), 'assets', 'certificate');
  }

  async getOrCreate(attemptId: string): Promise<CertRecord> {
    const existing = await this.prisma.certificate.findUnique({
      where: { attemptId },
    });
    if (existing) return existing;

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        performanceLevel: true,
        session: {
          include: {
            participant: {
              include: { designation: true, line: true },
            },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const participant = attempt.session.participant;
    const certNo = `${this.certPrefix}-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const cert = await this.prisma.certificate.create({
      data: {
        attemptId,
        participantId: participant.id,
        certificateNo: certNo,
        participantName: participant.name,
        employeeCode: participant.code,
        designationName: participant.designation.name,
        lineName: participant.line.name,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        performanceName: attempt.performanceLevel?.name ?? 'N/A',
        performanceColor: attempt.performanceLevel?.color,
      },
    });

    return cert;
  }

  async downloadPdf(
    attemptId: string,
  ): Promise<{ buffer: Buffer; certNo: string }> {
    const cert = await this.getOrCreate(attemptId);
    const buffer = await this.buildPdfBuffer(cert);
    return { buffer, certNo: cert.certificateNo };
  }

  /**
   * Issues (or returns) the certificate for a completed game run. Only runs that
   * landed in a certificate-eligible judgement band qualify; the band name is
   * used as the "performance level" on the certificate.
   */
  async getOrCreateForGame(gameRunId: string): Promise<CertRecord> {
    const existing = await this.prisma.certificate.findUnique({
      where: { gameRunId },
    });
    if (existing) return existing;

    const run = await this.prisma.gameRun.findUnique({
      where: { id: gameRunId },
      include: {
        judgementBand: true,
        session: {
          include: {
            participant: { include: { designation: true, line: true } },
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Game run not found');
    if (run.status !== 'COMPLETED') {
      throw new BadRequestException('Game run is not completed');
    }
    if (!run.judgementBand?.certificateEligible) {
      throw new BadRequestException(
        'This game result is not eligible for a certificate',
      );
    }

    const participant = run.session.participant;
    const percentage = run.maxScore > 0 ? (run.score / run.maxScore) * 100 : 0;
    const certNo = `${this.certPrefix}-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const cert = await this.prisma.certificate.create({
      data: {
        gameRunId,
        participantId: participant.id,
        certificateNo: certNo,
        participantName: participant.name,
        employeeCode: participant.code,
        designationName: participant.designation.name,
        lineName: participant.line.name,
        score: run.score,
        maxScore: run.maxScore,
        percentage,
        performanceName: run.judgementBand.name,
        performanceColor: run.judgementBand.color,
      },
    });

    return cert;
  }

  async downloadPdfForGame(
    gameRunId: string,
  ): Promise<{ buffer: Buffer; certNo: string }> {
    const cert = await this.getOrCreateForGame(gameRunId);
    const buffer = await this.buildPdfBuffer(cert);
    return { buffer, certNo: cert.certificateNo };
  }

  private buildPdfBuffer(cert: CertRecord): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 0,
      });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width; // 841.89
      const H = doc.page.height; // 595.28

      const NAVY = '#16284c';
      const CREAM = '#fffdf3';
      const TEXT_DARK = '#15171c';
      const TEXT_GRAY = '#3f4654';
      const TEXT_LGRAY = '#9ca3af';
      const TEXT_MUTED = '#5b6472';
      const LINE_COLOR = '#b0b6c0';

      // Navy frame + cream background
      const BORDER = 10;
      doc.rect(0, 0, W, H).fill(NAVY);
      doc.rect(BORDER, BORDER, W - BORDER * 2, H - BORDER * 2).fill(CREAM);

      // Gold corner ornaments
      const ORNAMENT = 120;
      const INSET = BORDER + 4;
      this.drawCornerOrnament(doc, INSET, INSET, ORNAMENT, false, false);
      this.drawCornerOrnament(doc, W - INSET, INSET, ORNAMENT, true, false);
      this.drawCornerOrnament(doc, INSET, H - INSET, ORNAMENT, false, true);
      this.drawCornerOrnament(doc, W - INSET, H - INSET, ORNAMENT, true, true);

      const CONTENT_X = 56;
      const CONTENT_W = W - CONTENT_X * 2;
      const CONTENT_TOP = 92;
      const CONTENT_BOTTOM = H - 30;

      // ---- Header: logo, title, Toyota Pro icon ----
      const logoSize = 84;
      const logoX = CONTENT_X + 46;
      const logoY = CONTENT_TOP;
      doc
        .roundedRect(logoX, logoY, logoSize, logoSize, 7)
        .fillAndStroke('#ffffff', '#e5e7eb');
      doc.image(path.join(this.assetsDir, 'logo.png'), logoX, logoY, {
        fit: [logoSize, logoSize],
        align: 'center',
        valign: 'center',
      });

      const iconW = 93;
      const iconH = 76;
      const iconX = W - CONTENT_X - 46 - iconW;
      const iconY = CONTENT_TOP + (logoSize - iconH) / 2;
      this.drawToyotaProIcon(doc, iconX, iconY, iconW, iconH);
      doc
        .font('Times-Bold')
        .fontSize(9)
        .fillColor(TEXT_DARK)
        .text('Toyota Pro', iconX, iconY + iconH + 5, {
          width: iconW,
          align: 'center',
        });

      const titleX = logoX + logoSize + 16;
      const titleW = iconX - 16 - titleX;
      doc
        .font('Times-Bold')
        .fontSize(22)
        .fillColor(TEXT_DARK)
        .text('Toyota Kirloskar Motor', titleX, CONTENT_TOP, {
          width: titleW,
          align: 'center',
        });
      doc
        .font('Times-Bold')
        .fontSize(34)
        .fillColor(NAVY)
        .text('Certificate', titleX, CONTENT_TOP + 30, {
          width: titleW,
          align: 'center',
          characterSpacing: 2,
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(TEXT_GRAY)
        .text('OF APPRECIATION', titleX, CONTENT_TOP + 73, {
          width: titleW,
          align: 'center',
          characterSpacing: 3,
        });

      // ---- Middle: awarded to / name / body ----
      let cy = CONTENT_TOP + 100;

      const awardedTo = 'This certificate is proudly awarded to';
      doc
        .font('Times-Italic')
        .fontSize(13)
        .fillColor(TEXT_MUTED)
        .text(awardedTo, CONTENT_X, cy, { width: CONTENT_W, align: 'center' });
      cy +=
        doc.heightOfString(awardedTo, { width: CONTENT_W, align: 'center' }) +
        8;

      doc
        .font('Times-Bold')
        .fontSize(30)
        .fillColor(NAVY)
        .text(cert.participantName, CONTENT_X, cy, {
          width: CONTENT_W,
          align: 'center',
        });
      cy +=
        doc.heightOfString(cert.participantName, {
          width: CONTENT_W,
          align: 'center',
        }) + 8;

      const underlineW = CONTENT_W * 0.55;
      doc
        .moveTo(CONTENT_X + (CONTENT_W - underlineW) / 2, cy)
        .lineTo(CONTENT_X + (CONTENT_W + underlineW) / 2, cy)
        .lineWidth(0.75)
        .opacity(0.35)
        .strokeColor(NAVY)
        .stroke();
      doc.opacity(1);
      cy += 10;

      const meta = [cert.employeeCode, cert.designationName, cert.lineName]
        .filter(Boolean)
        .join(' · ')
        .toUpperCase();
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(TEXT_LGRAY)
        .text(meta, CONTENT_X, cy, {
          width: CONTENT_W,
          align: 'center',
          characterSpacing: 2,
        });
      cy +=
        doc.heightOfString(meta, {
          width: CONTENT_W,
          align: 'center',
          characterSpacing: 2,
        }) + 18;

      const bodyX = CONTENT_X + 25;
      const bodyW = CONTENT_W - 50;
      this.drawCenteredRichText(
        doc,
        [
          {
            text: 'We appreciate you for successfully completing the ',
            font: 'Times-Italic',
            color: TEXT_GRAY,
          },
          {
            text: 'Paint Shop Dojo Training Program',
            font: 'Times-BoldItalic',
            color: NAVY,
          },
          {
            text: ' and demonstrating a performance level of ',
            font: 'Times-Italic',
            color: TEXT_GRAY,
          },
          { text: cert.performanceName, font: 'Times-BoldItalic', color: NAVY },
          { text: ' with a score of ', font: 'Times-Italic', color: TEXT_GRAY },
          {
            text: `${Math.round(cert.percentage)}%`,
            font: 'Times-BoldItalic',
            color: NAVY,
          },
          {
            text: '. Your dedication will be of prime importance in the success of TKM.',
            font: 'Times-Italic',
            color: TEXT_GRAY,
          },
        ],
        bodyX,
        cy,
        bodyW,
        13,
        4,
      );

      // ---- Footer: medal (signatures removed — Certificate of Appreciation has no signatories) ----
      const FOOTER_H = 110;
      const footerY = CONTENT_BOTTOM - FOOTER_H;
      // const sigW = CONTENT_W * 0.26;

      // this.drawSignatureBlock(doc, CONTENT_X + 46, footerY, sigW, FOOTER_H, {
      //   name: 'M Abdul Khadir',
      //   title: 'General Manager',
      //   subtitle: 'Global Best Manufacturing',
      // });
      // this.drawSignatureBlock(
      //   doc,
      //   W - CONTENT_X - 46 - sigW,
      //   footerY,
      //   sigW,
      //   FOOTER_H,
      //   {
      //     name: 'B Padmanabha',
      //     title: 'EVP & Director',
      //     subtitle: 'Manufacturing',
      //   },
      // );

      const badgeSize = 100;
      doc.image(
        path.join(this.assetsDir, 'badge.jpg'),
        W / 2 - badgeSize / 2,
        footerY + FOOTER_H - badgeSize - 6,
        { fit: [badgeSize, badgeSize], align: 'center', valign: 'center' },
      );

      // ---- Certificate no / issued date ----
      const issued = cert.issuedAt.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(LINE_COLOR)
        .text(
          `CERTIFICATE NO. ${cert.certificateNo}     •     ISSUED ${issued.toUpperCase()}`,
          CONTENT_X,
          CONTENT_BOTTOM + 8,
          {
            width: CONTENT_W,
            align: 'center',
            characterSpacing: 2,
          },
        );

      doc.end();
    });
  }

  /** Word-wraps mixed-font/color text segments into lines centered within `width`. */
  private drawCenteredRichText(
    doc: PDFKit.PDFDocument,
    segments: { text: string; font: string; color: string }[],
    x: number,
    y: number,
    width: number,
    fontSize: number,
    lineGap: number,
  ): number {
    type Token = {
      text: string;
      font: string;
      color: string;
      width: number;
      isSpace: boolean;
    };
    const tokens: Token[] = [];
    for (const seg of segments) {
      for (const part of seg.text.split(/(\s+)/).filter((p) => p.length > 0)) {
        doc.font(seg.font).fontSize(fontSize);
        tokens.push({
          text: part,
          font: seg.font,
          color: seg.color,
          width: doc.widthOfString(part),
          isSpace: /^\s+$/.test(part),
        });
      }
    }

    const lines: Token[][] = [];
    let current: Token[] = [];
    let currentWidth = 0;
    for (const tok of tokens) {
      if (tok.isSpace && current.length === 0) continue;
      if (currentWidth + tok.width > width && current.length > 0) {
        while (current.length && current[current.length - 1].isSpace) {
          currentWidth -= current.pop()!.width;
        }
        lines.push(current);
        current = [];
        currentWidth = 0;
        if (tok.isSpace) continue;
      }
      current.push(tok);
      currentWidth += tok.width;
    }
    while (current.length && current[current.length - 1].isSpace) {
      currentWidth -= current.pop()!.width;
    }
    if (current.length) lines.push(current);

    doc.fontSize(fontSize);
    const lineHeight = doc.currentLineHeight() + lineGap;
    let cy = y;
    for (const line of lines) {
      const lineWidth = line.reduce((sum, t) => sum + t.width, 0);
      let cx = x + (width - lineWidth) / 2;
      for (const tok of line) {
        doc
          .font(tok.font)
          .fontSize(fontSize)
          .fillColor(tok.color)
          .text(tok.text, cx, cy, { lineBreak: false });
        cx += tok.width;
      }
      cy += lineHeight;
    }
    return cy;
  }

  /** Hand-drawn gold filigree corner flourish — mirrors the on-screen CornerOrnament SVG. */
  private drawCornerOrnament(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    size: number,
    flipX: boolean,
    flipY: boolean,
  ) {
    const s = size / 140;
    const gold = '#c9a227';

    doc.save();
    doc.translate(x, y);
    doc.scale(flipX ? -s : s, flipY ? -s : s);
    doc.lineCap('round');

    doc.path('M4 70 V22 Q4 4 22 4 H70').lineWidth(3).strokeColor(gold).stroke();
    doc.opacity(0.55);
    doc
      .path('M16 90 V34 Q16 16 34 16 H90')
      .lineWidth(1.5)
      .strokeColor(gold)
      .stroke();
    doc.opacity(1);
    doc
      .path(
        'M22 58 C22 36 38 22 60 24 C80 26 90 44 78 58 C68 69 52 64 54 50 C55 41 65 39 70 46',
      )
      .lineWidth(2.5)
      .strokeColor(gold)
      .stroke();

    doc.fillColor(gold);
    doc.circle(70, 46, 3).fill();
    doc.circle(22, 58, 2).fill();
    doc.circle(92, 3, 2).fill();
    doc.circle(3, 92, 2).fill();

    this.drawRotatedEllipse(doc, 104, 6, 14, 5, 12, gold);
    this.drawRotatedEllipse(doc, 129, 12, 9, 3.5, 12, gold);
    this.drawRotatedEllipse(doc, 6, 104, 5, 14, 12, gold);
    this.drawRotatedEllipse(doc, 12, 129, 3.5, 9, 12, gold);

    doc.restore();
  }

  private drawRotatedEllipse(
    doc: PDFKit.PDFDocument,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    angleDeg: number,
    color: string,
  ) {
    doc.save();
    doc.translate(cx, cy);
    doc.rotate(angleDeg);
    doc.ellipse(0, 0, rx, ry).fill(color);
    doc.restore();
  }

  /** "Toyota Pro" gear + hard-hat operator icon — mirrors the on-screen ToyotaProIcon SVG. */
  private drawToyotaProIcon(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const s = Math.min(w / 200, h / 160);

    doc.save();
    doc.translate(x + (w - 200 * s) / 2, y + (h - 160 * s) / 2);
    doc.scale(s);

    // Gear / circuit emblem
    doc.save();
    doc.translate(60, 85);
    for (let i = 0; i < 8; i++) {
      doc.save();
      doc.rotate(i * 45);
      doc.roundedRect(-7, -52, 14, 20, 3).fill('#3f7e94');
      doc.restore();
    }
    doc.circle(0, 0, 36).fill('#3f7e94');
    doc.circle(0, 0, 14).fill('#eef7f9');
    doc.lineWidth(3).strokeColor('#eef7f9').lineCap('round');
    doc.moveTo(0, 0).lineTo(0, -34).stroke();
    doc.moveTo(0, 0).lineTo(29, 18).stroke();
    doc.moveTo(0, 0).lineTo(-29, 18).stroke();
    doc.fillColor('#eef7f9');
    doc.circle(0, -34, 4).fill();
    doc.circle(29, 18, 4).fill();
    doc.circle(-29, 18, 4).fill();
    doc.restore();

    // Operator with hard hat
    doc.save();
    doc.translate(128, 80);
    doc
      .path('M-32 78 C-32 38 -16 22 0 22 C16 22 32 38 32 78 Z')
      .fill('#1f2a3d');
    doc.path('M-10 30 L0 46 L10 30 Z').fill('#ffffff');
    doc.path('M-5 32 L5 32 L3 60 L0 68 L-3 60 Z').fill('#2f6fb0');
    doc.circle(0, -8, 22).fill('#f3c69b');
    doc.ellipse(0, -22, 27, 6).fill('#e8650c');
    doc.save();
    doc.rect(-30, -42, 60, 20).clip();
    doc.ellipse(0, -22, 22, 20).fill('#ff7a1e');
    doc.restore();
    doc.lineWidth(3).strokeColor('#e8650c').lineCap('round');
    doc.moveTo(0, -42).lineTo(0, -34).stroke();
    doc.restore();

    doc.restore();
  }

  // Signatures removed — Certificate of Appreciation is unsigned. Kept here
  // in case a future certificate type needs signatories again.
  // /** Bottom-aligned signature block: name, underline, title, optional subtitle. */
  // private drawSignatureBlock(
  //   doc: PDFKit.PDFDocument,
  //   x: number,
  //   y: number,
  //   w: number,
  //   h: number,
  //   sig: { name: string; title: string; subtitle?: string },
  // ) {
  //   const TEXT_GRAY = '#3f4654';
  //   const TEXT_LGRAY = '#9ca3af';

  //   doc.font('Times-Italic').fontSize(13);
  //   const nameH = doc.heightOfString(sig.name, { width: w, align: 'center' });
  //   doc.font('Helvetica-Bold').fontSize(9);
  //   const titleH = doc.heightOfString(sig.title.toUpperCase(), {
  //     width: w,
  //     align: 'center',
  //     characterSpacing: 1.5,
  //   });
  //   let subtitleH = 0;
  //   if (sig.subtitle) {
  //     doc.font('Helvetica').fontSize(8);
  //     subtitleH = doc.heightOfString(sig.subtitle, {
  //       width: w,
  //       align: 'center',
  //     });
  //   }

  //   const total = nameH + 6 + 1 + 6 + titleH + (sig.subtitle ? subtitleH : 0);
  //   let cy = y + h - total;

  //   doc
  //     .font('Times-Italic')
  //     .fontSize(13)
  //     .fillColor('#1f2530')
  //     .text(sig.name, x, cy, { width: w, align: 'center' });
  //   cy += nameH + 6;

  //   doc
  //     .moveTo(x, cy)
  //     .lineTo(x + w, cy)
  //     .lineWidth(0.5)
  //     .strokeColor('#9ca3af')
  //     .stroke();
  //   cy += 1 + 6;

  //   doc
  //     .font('Helvetica-Bold')
  //     .fontSize(9)
  //     .fillColor(TEXT_GRAY)
  //     .text(sig.title.toUpperCase(), x, cy, {
  //       width: w,
  //       align: 'center',
  //       characterSpacing: 1.5,
  //     });
  //   cy += titleH;

  //   if (sig.subtitle) {
  //     doc
  //       .font('Helvetica')
  //       .fontSize(8)
  //       .fillColor(TEXT_LGRAY)
  //       .text(sig.subtitle, x, cy, { width: w, align: 'center' });
  //   }
  // }

  // Kept for any direct callers
  async generatePdf(attemptId: string): Promise<Buffer> {
    const cert = await this.getOrCreate(attemptId);
    return this.buildPdfBuffer(cert);
  }

  async findAllAdmin(
    page = 1,
    limit = 25,
    search?: string,
    designationName?: string,
    status?: string,
    lineId?: string,
    plantId?: string,
  ) {
    const where: Prisma.CertificateWhereInput = {};
    const searchTerms = search?.trim().split(/\s+/).filter(Boolean) ?? [];

    if (searchTerms.length > 0) {
      where.AND = searchTerms.map((term) => ({
        OR: [
          { participantName: { contains: term, mode: 'insensitive' } },
          { certificateNo: { contains: term, mode: 'insensitive' } },
          { employeeCode: { contains: term, mode: 'insensitive' } },
          { designationName: { contains: term, mode: 'insensitive' } },
          { lineName: { contains: term, mode: 'insensitive' } },
        ],
      }));
    }
    if (designationName) {
      where.designationName = designationName;
    }
    if (status && status !== 'Valid') {
      where.id = { equals: '__unsupported_certificate_status__' };
    }
    if (lineId || plantId) {
      where.participant = {
        ...(lineId ? { lineId } : {}),
        ...(plantId ? { plantId } : {}),
      };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [data, total, issuedThisMonth, designations] =
      await this.prisma.$transaction([
        this.prisma.certificate.findMany({
          where,
          orderBy: { issuedAt: 'desc' },
          skip: (Math.max(page, 1) - 1) * limit,
          take: limit,
        }),
        this.prisma.certificate.count({ where }),
        this.prisma.certificate.count({
          where: { ...where, issuedAt: { gte: monthStart } },
        }),
        this.prisma.certificate.findMany({
          distinct: ['designationName'],
          orderBy: { designationName: 'asc' },
          select: { designationName: true },
        }),
      ]);

    return {
      data,
      total,
      page,
      limit,
      validCount: total,
      issuedThisMonth,
      designationOptions: designations.map(
        (designation) => designation.designationName,
      ),
      statusOptions: ['Valid'],
    };
  }
}
