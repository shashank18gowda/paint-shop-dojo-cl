import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.kind === 'admin') {
      const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
      if (!admin || !admin.isActive) throw new UnauthorizedException();
      // Shape so RolesGuard (which reads `user.role`) works for admin tokens too.
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        kind: 'admin' as const,
      };
    }

    const participant = await this.prisma.participant.findUnique({
      where: { id: payload.sub },
      include: { designation: true, line: true, participantType: true },
    });
    if (!participant || !participant.isActive) throw new UnauthorizedException();
    return participant;
  }
}
