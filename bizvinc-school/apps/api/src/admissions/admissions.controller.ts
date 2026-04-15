import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto, UpdateAdmissionStatusDto } from './dto/create-admission.dto';

@ApiTags('admissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admissions')
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Post()
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  create(@TenantId() tenantId: string, @Body() dto: CreateAdmissionDto) {
    return this.admissionsService.create(tenantId, dto);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.admissionsService.findAll(tenantId, status, +page, +limit);
  }

  @Get('counts')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  getCounts(@TenantId() tenantId: string) {
    return this.admissionsService.getCounts(tenantId);
  }

  @Patch(':id/status')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAdmissionStatusDto,
  ) {
    return this.admissionsService.updateStatus(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.admissionsService.remove(tenantId, id);
  }
}
