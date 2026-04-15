import {
  Controller, Post, Body, Param, UseGuards, RawBodyRequest, Req, Headers, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber } from 'class-validator';
import { PaymentsService } from './payments.service';
import { PaymentGateway } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';

class InitiatePaymentDto {
  @IsString() invoiceId: string;
  @IsEnum(PaymentGateway) gateway: PaymentGateway;
}

class ManualPaymentDto {
  @IsString() invoiceId: string;
  @IsNumber() amount: number;
}

@ApiTags('fees')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate a payment for an invoice' })
  initiatePayment(@TenantId() tenantId: string, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(tenantId, dto.invoiceId, dto.gateway);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record a manual/cash payment' })
  manualPayment(@TenantId() tenantId: string, @Body() dto: ManualPaymentDto) {
    return this.paymentsService.recordManualPayment(tenantId, dto.invoiceId, dto.amount);
  }

  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody as Buffer, signature);
  }
}
