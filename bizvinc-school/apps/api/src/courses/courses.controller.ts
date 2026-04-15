import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto, CreateModuleDto, CreateLessonDto } from './dto/create-course.dto';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.coursesService.findAll(tenantId, search, +page, +limit);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.coursesService.findOne(tenantId, id);
  }

  @Get(':id/modules')
  getModules(@TenantId() tenantId: string, @Param('id') courseId: string) {
    return this.coursesService.getModules(tenantId, courseId);
  }

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(tenantId, dto);
  }

  @Post(':id/modules')
  addModule(
    @TenantId() tenantId: string,
    @Param('id') courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.coursesService.addModule(tenantId, courseId, dto);
  }

  @Post('modules/:moduleId/lessons')
  addLesson(
    @TenantId() tenantId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.coursesService.addLesson(tenantId, moduleId, dto);
  }

  @Post('lessons/:lessonId/complete')
  completeLesson(
    @TenantId() tenantId: string,
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: { id: string; studentId?: string },
  ) {
    return this.coursesService.completeLesson(tenantId, lessonId, user.id);
  }
}
