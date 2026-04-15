import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

interface SendNotificationDto {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Persist and send an in-app notification to a specific user.
   * In production, this would also dispatch FCM push, SMS, WhatsApp via queues.
   */
  async sendToUser(
    userId: string,
    tenantId: string,
    dto: SendNotificationDto,
  ): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          tenantId,
          userId,
          title: dto.title,
          body: dto.body,
          type: dto.type,
          data: dto.data ?? {},
          channel: 'IN_APP',
          sentAt: new Date(),
        },
      });
      this.logger.log(`Notification sent to user ${userId}: ${dto.title}`);
    } catch (err) {
      this.logger.error(`Failed to send notification to user ${userId}`, err);
    }
  }

  /**
   * Broadcast a notification to all users matching a role within a tenant.
   */
  async broadcast(
    tenantId: string,
    roles: string[],
    dto: SendNotificationDto,
  ): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { tenantId, role: { in: roles as never[] }, isActive: true },
      select: { id: true },
    });

    await Promise.allSettled(
      users.map((u) => this.sendToUser(u.id, tenantId, dto)),
    );
  }

  /**
   * Get paginated notifications for a user.
   */
  async getUserNotifications(userId: string, tenantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId, tenantId } }),
      this.prisma.notification.count({ where: { userId, tenantId, isRead: false } }),
    ]);
    return { data, total, unread, page, limit };
  }

  /** Mark a single notification as read. */
  async markRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** Mark all notifications as read for a user. */
  async markAllRead(userId: string, tenantId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, tenantId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
