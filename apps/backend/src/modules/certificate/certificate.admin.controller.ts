import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DEFAULT_PAGE_SIZE } from '../../config/constants';

@ApiTags('admin')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/certificates')
export class CertificateAdminController {
  constructor(private service: CertificateService) {}

  @Get()
  @ApiOperation({ summary: 'List certificates with optional filters (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'designationName', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['Valid'] })
  @ApiQuery({ name: 'lineId', required: false, type: String })
  @ApiQuery({ name: 'plantId', required: false, type: String })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = DEFAULT_PAGE_SIZE,
    @Query('search') search?: string,
    @Query('designationName') designationName?: string,
    @Query('status') status?: string,
    @Query('lineId') lineId?: string,
    @Query('plantId') plantId?: string,
  ) {
    return this.service.findAllAdmin(+page, +limit, search, designationName, status, lineId, plantId);
  }
}
