import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all students' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'classId', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('classId') classId?: string,
  ) {
    return this.studentsService.findAll(tenantId, { page, limit, search, classId });
  }

  @Post()
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Create a new student' })
  create(@TenantId() tenantId: string, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student profile' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.studentsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Update student' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateStudentDto>,
  ) {
    return this.studentsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  @ApiOperation({ summary: 'Deactivate student' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.studentsService.remove(tenantId, id);
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get student attendance history' })
  getAttendance(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.studentsService.getAttendance(
      tenantId,
      id,
      new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      new Date(endDate || new Date().toISOString()),
    );
  }

  @Get(':id/grades')
  @ApiOperation({ summary: 'Get student grades' })
  getGrades(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.studentsService.getGrades(tenantId, id);
  }

  @Get(':id/invoices')
  @ApiOperation({ summary: 'Get student invoices' })
  getInvoices(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.studentsService.getInvoices(tenantId, id);
  }
}
