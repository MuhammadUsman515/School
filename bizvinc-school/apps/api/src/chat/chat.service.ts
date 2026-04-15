import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(tenantId: string, senderId: string, dto: SendMessageDto) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.chatMessage.create({
        data: {
          tenantId,
          senderId,
          recipientId: dto.recipientId,
          content: dto.content,
        },
        include: {
          sender: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
    );
  }

  async getConversation(tenantId: string, userId: string, otherId: string, page = 1, limit = 50) {
    const where = {
      tenantId,
      OR: [
        { senderId: userId, recipientId: otherId },
        { senderId: otherId, recipientId: userId },
      ],
    };
    const [data, total] = await this.prisma.forTenant(tenantId, async (tx) => {
      const [d, t] = await Promise.all([
        tx.chatMessage.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        }),
        tx.chatMessage.count({ where }),
      ]);
      return [d, t];
    });
    return { data: data.reverse(), total, page, limit };
  }

  async getInbox(tenantId: string, userId: string) {
    return this.prisma.forTenant(tenantId, async (tx) => {
      const messages = await tx.chatMessage.findMany({
        where: {
          tenantId,
          OR: [{ senderId: userId }, { recipientId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      });

      // Deduplicate to one message per conversation partner
      const seen = new Set<string>();
      return messages.filter((m) => {
        const partnerId = m.senderId === userId ? m.recipientId : m.senderId;
        if (!partnerId || seen.has(partnerId)) return false;
        seen.add(partnerId);
        return true;
      });
    });
  }

  async markRead(tenantId: string, userId: string, senderId: string) {
    return this.prisma.forTenant(tenantId, (tx) =>
      tx.chatMessage.updateMany({
        where: { tenantId, senderId, recipientId: userId, isRead: false },
        data: { isRead: true },
      }),
    );
  }
}
