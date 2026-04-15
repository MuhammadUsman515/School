import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { TimetableService } from './timetable.service';
import { CreateSlotDto } from './dto/create-slot.dto';

@ApiTags('timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('classId') classId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.timetableService.findAll(tenantId, classId, teacherId);
  }

  @Post()
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  create(@TenantId() tenantId: string, @Body() dto: CreateSlotDto) {
    return this.timetableService.create(tenantId, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.timetableService.remove(tenantId, id);
  }
}
