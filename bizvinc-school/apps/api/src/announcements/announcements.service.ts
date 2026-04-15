import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, AnnouncementPriority } from '@prisma/client';

export class CreateAnnouncementDto {
  title: string;
  content: string;
  targetRoles?: UserRole[];
  targetClassIds?: string[];
  priority?: AnnouncementPriority;
  attachmentUrls?: string[];
  publishAt?: string;
  expiresAt?: string;
  isPublished?: boolean;
}

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, authorId: string, dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        tenantId,
        authorId,
        title: dto.title,
        content: dto.content,
        targetRoles: dto.targetRoles || [],
        targetClassIds: dto.targetClassIds || [],
        priority: dto.priority || 'NORMAL',
        attachmentUrls: dto.attachmentUrls || [],
        publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async findAll(tenantId: string, role?: UserRole) {
    const where: Record<string, unknown> = { tenantId, isPublished: true };
    if (role) {
      where.OR = [
        { targetRoles: { isEmpty: true } },
        { targetRoles: { has: role } },
      ];
    }
    return this.prisma.announcement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async publish(tenantId: string, id: string) {
    const ann = await this.prisma.announcement.findFirst({ where: { id, tenantId } });
    if (!ann) throw new NotFoundException('Announcement not found');
    return this.prisma.announcement.update({
      where: { id },
      data: { isPublished: true, publishAt: new Date() },
    });
  }
}
