import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsArray, IsDateString, IsOptional } from 'class-validator';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';

class CreateInvoiceDto {
  @IsString() studentId: string;
  @IsArray() feeStructureIds: string[];
  @IsDateString() dueDate: string;
  @IsOptional() @IsString() notes?: string;
}

@ApiTags('fees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices' })
  findAll(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.invoicesService.findAll(tenantId, { status: status as never, studentId, page, limit });
  }

  @Post()
  @ApiOperation({ summary: 'Generate invoice' })
  create(@TenantId() tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.generateInvoice(
      tenantId,
      dto.studentId,
      dto.feeStructureIds,
      new Date(dto.dueDate),
      dto.notes,
    );
  }

  @Get('defaulters')
  @ApiOperation({ summary: 'Fee defaulters with aging buckets' })
  getDefaulters(@TenantId() tenantId: string) {
    return this.invoicesService.getDefaulters(tenantId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Financial dashboard summary' })
  getSummary(@TenantId() tenantId: string) {
    return this.invoicesService.getFinancialSummary(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice detail' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.findOne(tenantId, id);
  }
}
