import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClassesService, CreateClassDto } from './classes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query('academicYearId') academicYearId?: string) {
    return this.classesService.findAll(tenantId, academicYearId);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateClassDto) {
    return this.classesService.create(tenantId, dto);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.classesService.findOne(tenantId, id);
  }

  @Get(':id/students')
  getStudents(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.classesService.getStudents(tenantId, id);
  }
}
