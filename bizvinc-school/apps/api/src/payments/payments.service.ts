import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentGateway } from '@prisma/client';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Initiate a payment for an invoice. Routes to the correct gateway
   * based on the school's region or explicit gateway selection.
   */
  async initiatePayment(
    tenantId: string,
    invoiceId: string,
    gateway: PaymentGateway,
  ): Promise<{ paymentUrl?: string; clientSecret?: string; paymentId: string }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { student: { include: { user: { select: { email: true } } } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice already paid');

    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        studentId: invoice.studentId,
        invoiceId,
        amount: invoice.totalAmount,
        currency: 'USD',
        gateway,
        status: 'PENDING',
      },
    });

    switch (gateway) {
      case 'STRIPE':
        return this.handleStripePayment(payment.id, invoice, payment);
      case 'MANUAL':
        return { paymentId: payment.id };
      default:
        // For Razorpay, Flutterwave, PayTabs — return placeholder URL
        // (real integration requires country-specific SDK setup)
        return {
          paymentId: payment.id,
          paymentUrl: `https://pay.${gateway.toLowerCase()}.com/${payment.id}`,
        };
    }
  }

  private async handleStripePayment(
    paymentId: string,
    invoice: { totalAmount: number | { toString(): string }; student: { user: { email: string } } },
    payment: { id: string },
  ) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: invoice.student.user.email,
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(invoice.totalAmount) * 100),
            product_data: { name: 'School Fee Payment' },
          },
          quantity: 1,
        }],
        metadata: { paymentId: payment.id },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/fees/success?payment=${payment.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/fees/cancel`,
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { gatewayTxnId: session.id },
      });

      return { paymentId: payment.id, paymentUrl: session.url ?? undefined };
    } catch (err) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException('Failed to initiate Stripe payment');
    }
  }

  /**
   * Handle Stripe webhook events (payment confirmation, failure).
   */
  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || '',
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;
      if (!paymentId) return;

      const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
      if (!payment) return;

      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'SUCCESS', paidAt: new Date(), receiptNumber: uuidv4().slice(0, 8).toUpperCase() },
        }),
        this.prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
            paidAmount: payment.amount,
          },
        }),
      ]);
    }
  }

  /** Record a manual/offline payment. */
  async recordManualPayment(tenantId: string, invoiceId: string, amount: number) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const receipt = uuidv4().slice(0, 8).toUpperCase();
    await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          tenantId,
          studentId: invoice.studentId,
          invoiceId,
          amount,
          currency: 'USD',
          gateway: 'MANUAL',
          status: 'SUCCESS',
          paidAt: new Date(),
          receiptNumber: receipt,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: { increment: amount },
          status: amount >= Number(invoice.totalAmount) ? 'PAID' : 'PARTIAL',
          paidAt: amount >= Number(invoice.totalAmount) ? new Date() : undefined,
        },
      }),
    ]);

    return { receiptNumber: receipt };
  }
}
