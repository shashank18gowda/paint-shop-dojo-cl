import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ParticipantService } from './participant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentParticipant } from '../../common/decorators/current-participant.decorator';
import { UpdateMeDto } from './dto/update-me.dto';
import { DEFAULT_PAGE_SIZE } from '../../config/constants';

const ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

@ApiTags('participants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('participants')
export class ParticipantController {
  constructor(
    private service: ParticipantService,
    private config: ConfigService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all participants (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page = 1, @Query('limit') limit = DEFAULT_PAGE_SIZE) {
    return this.service.findAll(+page, +limit);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Look up participant by employee code' })
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Get(':code/stats')
  @ApiOperation({ summary: 'Get participant performance stats' })
  async getStats(@Param('code') code: string) {
    const p = await this.service.findByCode(code);
    return this.service.getStats(p.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own profile (name, designation, line)' })
  updateMe(
    @CurrentParticipant() participant: { id: string },
    @Body() dto: UpdateMeDto,
  ) {
    return this.service.updateMe(participant.id, dto);
  }

  @Post('me/photo')
  @ApiOperation({ summary: 'Upload participant profile photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: process.env.UPLOADS_PHOTOS_DIR ?? './uploads/photos',
        filename: (_req, file, cb) => {
          const req = _req as unknown as { user: { id: string } };
          const raw = extname(file.originalname).toLowerCase();
          const safeExt = ALLOWED_PHOTO_EXTENSIONS.includes(raw) ? raw : '.jpg';
          cb(null, `${req.user.id}${safeExt}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: Number(process.env.UPLOAD_MAX_SIZE_BYTES ?? 5 * 1024 * 1024) },
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentParticipant() participant: { id: string },
  ) {
    if (!file) throw new BadRequestException('Photo file is required');
    const backendUrl = this.config.get<string>('BACKEND_URL', 'http://localhost:3001');
    const imageUrl = `${backendUrl}/uploads/photos/${file.filename}`;
    await this.service.updatePhoto(participant.id, imageUrl);
    return { imageUrl };
  }
}
