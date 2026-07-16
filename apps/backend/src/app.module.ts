import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';
import { ParticipantModule } from './modules/participant/participant.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { CertificateModule } from './modules/certificate/certificate.module';
import { AdminModule } from './modules/admin/admin.module';
import { GameModule } from './modules/game/game.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, '..', '..', 'uploads'), serveRoot: '/uploads' }),
    PrismaModule,
    AuthModule,
    AdminAuthModule,
    ParticipantModule,
    MasterDataModule,
    QuizModule,
    LeaderboardModule,
    CertificateModule,
    AdminModule,
    GameModule,
    HealthModule,
  ],
})
export class AppModule {}
