import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('certificates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('certificates')
export class CertificateController {
  constructor(private service: CertificateService) {}

  @Get('game/:gameRunId')
  @ApiOperation({ summary: 'Get game certificate metadata (eligible runs only)' })
  getGameCertificate(@Param('gameRunId') gameRunId: string) {
    return this.service.getOrCreateForGame(gameRunId);
  }

  @Get('game/:gameRunId/download')
  @ApiOperation({ summary: 'Download game certificate as PDF' })
  async downloadGamePdf(
    @Param('gameRunId') gameRunId: string,
    @Res() res: Response,
  ) {
    const { buffer, certNo } = await this.service.downloadPdfForGame(gameRunId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certNo}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get(':attemptId')
  @ApiOperation({ summary: 'Get certificate metadata' })
  getCertificate(@Param('attemptId') attemptId: string) {
    return this.service.getOrCreate(attemptId);
  }

  @Get(':attemptId/download')
  @ApiOperation({ summary: 'Download certificate as PDF' })
  async downloadPdf(@Param('attemptId') attemptId: string, @Res() res: Response) {
    const { buffer, certNo } = await this.service.downloadPdf(attemptId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certNo}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
