import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService, CreateAssignmentDto, SubmitAssignmentDto } from './assignments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('lms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Query('classId') classId?: string,
  ) {
    const teacherUserId = ['TEACHER'].includes(role) ? userId : undefined;
    return this.assignmentsService.findAll(tenantId, classId, teacherUserId);
  }

  @Post()
  create(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(tenantId, userId, dto);
  }

  @Post(':id/submit')
  submit(
    @Param('id') assignmentId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    return this.assignmentsService.submitAssignment(assignmentId, userId, dto);
  }

  @Get(':id/submissions')
  getSubmissions(@TenantId() tenantId: string, @Param('id') assignmentId: string) {
    return this.assignmentsService.getSubmissions(tenantId, assignmentId);
  }

  @Patch('submissions/:id/grade')
  gradeSubmission(
    @Param('id') submissionId: string,
    @CurrentUser('id') userId: string,
    @Body('score') score: number,
    @Body('feedback') feedback: string,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, score, feedback, userId);
  }
}
