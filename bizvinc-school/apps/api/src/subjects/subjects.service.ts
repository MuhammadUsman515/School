import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.subject.findMany({
        where: { tenantId },
        orderBy: { name: 'asc' },
      }),
    );
  }

  async create(tenantId: string, dto: CreateSubjectDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.subject.create({ data: { tenantId, ...dto } }),
    );
  }

  async update(tenantId: string, id: string, dto: Partial<CreateSubjectDto>) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.subject.update({ where: { id }, data: dto }),
    );
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.subject.delete({ where: { id } }),
    );
  }
}
