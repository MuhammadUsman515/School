import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post()
  @ApiOperation({ summary: 'Mark class attendance (bulk)' })
  markAttendance(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markClassAttendance(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get attendance records for a class on a date' })
  getClassAttendance(
    @TenantId() tenantId: string,
    @Query('classId') classId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getClassAttendance(tenantId, classId, new Date(date));
  }

  @Get('reports/class')
  @ApiOperation({ summary: 'Monthly class attendance report' })
  getClassReport(
    @TenantId() tenantId: string,
    @Query('classId') classId: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.attendanceService.getClassReport(tenantId, classId, +month, +year);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Students below attendance threshold' })
  getAlerts(
    @TenantId() tenantId: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.attendanceService.getAttendanceAlerts(tenantId, threshold ? +threshold : 75);
  }
}
