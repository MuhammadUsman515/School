import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  sendMessage(
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(tenantId, user.id, dto);
  }

  @Get('inbox')
  getInbox(@TenantId() tenantId: string, @CurrentUser() user: { id: string }) {
    return this.chatService.getInbox(tenantId, user.id);
  }

  @Get('conversation/:userId')
  getConversation(
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param('userId') otherId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.chatService.getConversation(tenantId, user.id, otherId, +page, +limit);
  }

  @Post('conversation/:userId/read')
  markRead(
    @TenantId() tenantId: string,
    @CurrentUser() user: { id: string },
    @Param('userId') senderId: string,
  ) {
    return this.chatService.markRead(tenantId, user.id, senderId);
  }
}
