import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@ApiTags('subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.subjectsService.findAll(tenantId);
  }

  @Post()
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  create(@TenantId() tenantId: string, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('SCHOOL_ADMIN', 'PRINCIPAL')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: Partial<CreateSubjectDto>) {
    return this.subjectsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.subjectsService.remove(tenantId, id);
  }
}
