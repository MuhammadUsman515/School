import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeeFrequency, FeeType } from '@prisma/client';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';

@Injectable()
export class FeeStructuresService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, _classId?: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.feeStructure.findMany({
        where: { tenantId, isActive: true },
        orderBy: [{ feeType: 'asc' }, { name: 'asc' }],
      }),
    );
  }

  async create(tenantId: string, dto: CreateFeeStructureDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.feeStructure.create({
        data: {
          tenantId,
          name: dto.name,
          amount: dto.amount,
          feeType: dto.feeType as FeeType,
          frequency: dto.frequency as FeeFrequency,
          description: dto.description,
          isActive: true,
        },
      }),
    );
  }

  async update(tenantId: string, id: string, dto: Partial<CreateFeeStructureDto>) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.feeStructure.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
          ...(dto.feeType !== undefined ? { feeType: dto.feeType as FeeType } : {}),
          ...(dto.frequency !== undefined ? { frequency: dto.frequency as FeeFrequency } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
      }),
    );
  }

  async deactivate(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.feeStructure.update({ where: { id }, data: { isActive: false } }),
    );
  }
}
