import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { AcademicYearsService } from './academic-years.service';
import { CreateAcademicYearDto, CreateTermDto } from './dto/create-academic-year.dto';

@ApiTags('academic-years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.academicYearsService.findAll(tenantId);
  }

  @Get('current')
  getCurrent(@TenantId() tenantId: string) {
    return this.academicYearsService.getCurrent(tenantId);
  }

  @Post()
  @Roles('SCHOOL_ADMIN')
  create(@TenantId() tenantId: string, @Body() dto: CreateAcademicYearDto) {
    return this.academicYearsService.create(tenantId, dto);
  }

  @Post(':id/terms')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  addTerm(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateTermDto,
  ) {
    return this.academicYearsService.addTerm(tenantId, id, dto);
  }

  @Patch(':id/set-current')
  @Roles('SCHOOL_ADMIN')
  setCurrentYear(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.academicYearsService.setCurrentYear(tenantId, id);
  }
}
