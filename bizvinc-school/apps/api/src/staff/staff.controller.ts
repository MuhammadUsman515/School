import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.staffService.findAll(tenantId, search, +page, +limit);
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.staffService.findOne(tenantId, id);
  }

  @Post()
  @Roles('SCHOOL_ADMIN')
  create(@TenantId() tenantId: string, @Body() dto: CreateStaffDto) {
    return this.staffService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateStaffDto>,
  ) {
    return this.staffService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN')
  deactivate(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.staffService.deactivate(tenantId, id);
  }
}
