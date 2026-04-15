import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { ExamsService } from './exams.service';
import { AddExamQuestionsDto, CreateExamDto, SubmitExamResultDto, UpdateExamStatusDto } from './dto/create-exam.dto';

@ApiTags('exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.examsService.findAll(tenantId, status, +page, +limit);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.examsService.findOne(tenantId, id);
  }

  @Post()
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  create(@TenantId() tenantId: string, @Body() dto: CreateExamDto) {
    return this.examsService.create(tenantId, dto);
  }

  @Post(':id/questions')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  addQuestions(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AddExamQuestionsDto,
  ) {
    return this.examsService.addQuestions(tenantId, id, dto);
  }

  @Patch(':id/status')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExamStatusDto,
  ) {
    return this.examsService.updateStatus(tenantId, id, dto);
  }

  @Post(':id/results')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER')
  submitResult(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: SubmitExamResultDto,
  ) {
    return this.examsService.submitResult(tenantId, id, dto);
  }
}
