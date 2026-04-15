import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { SubmitGradeDto } from './dto/submit-grade.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('grades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('grades')
export class GradesController {
  constructor(private gradesService: GradesService) {}

  @Get()
  @ApiOperation({ summary: 'Get grades for a class' })
  getGrades(
    @TenantId() tenantId: string,
    @Query('classId') classId: string,
    @Query('subjectId') subjectId?: string,
    @Query('termId') termId?: string,
  ) {
    return this.gradesService.getGrades(tenantId, classId, subjectId, termId);
  }

  @Post()
  @ApiOperation({ summary: 'Submit a grade' })
  submitGrade(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitGradeDto,
  ) {
    return this.gradesService.upsertGrade(tenantId, userId, dto);
  }

  @Get('report-card/:studentId/:termId')
  @ApiOperation({ summary: 'Generate student report card' })
  getReportCard(
    @TenantId() tenantId: string,
    @Param('studentId') studentId: string,
    @Param('termId') termId: string,
  ) {
    return this.gradesService.getReportCard(tenantId, studentId, termId);
  }
}
