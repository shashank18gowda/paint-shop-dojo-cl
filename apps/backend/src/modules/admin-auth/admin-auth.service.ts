import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Same generic message for missing admin OR bad password — avoids leaking
    // which emails are registered.
    const invalid = () => new UnauthorizedException('Invalid email or password');

    if (!admin || !admin.isActive) {
      this.logger.warn(`Failed admin login attempt for: ${dto.email}`);
      throw invalid();
    }

    const ok = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!ok) {
      this.logger.warn(`Failed admin login attempt for: ${dto.email}`);
      throw invalid();
    }

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Admin logged in: ${admin.email} (${admin.id})`);

    const token = await this.jwt.signAsync({
      sub: admin.id,
      kind: 'admin',
      email: admin.email,
      role: admin.role,
    });

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async getMe(adminId: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException();
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      receivesDailyReport: admin.receivesDailyReport,
      lastLoginAt: admin.lastLoginAt,
    };
  }
}
