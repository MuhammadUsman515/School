import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant.decorator';
import { FeeStructuresService } from './fee-structures.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';

@ApiTags('fee-structures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fee-structures')
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) {}

  @Get()
  findAll(@TenantId() tenantId: string, @Query('classId') classId?: string) {
    return this.feeStructuresService.findAll(tenantId, classId);
  }

  @Post()
  @Roles('SCHOOL_ADMIN', 'FINANCE_OFFICER')
  create(@TenantId() tenantId: string, @Body() dto: CreateFeeStructureDto) {
    return this.feeStructuresService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles('SCHOOL_ADMIN', 'FINANCE_OFFICER')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateFeeStructureDto>,
  ) {
    return this.feeStructuresService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN', 'FINANCE_OFFICER')
  deactivate(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.feeStructuresService.deactivate(tenantId, id);
  }
}
