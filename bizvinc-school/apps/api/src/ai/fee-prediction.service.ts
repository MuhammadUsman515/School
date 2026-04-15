import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskCategory } from '@prisma/client';

interface PaymentFeatures {
  latePaymentCount: number;
  latePaymentRate: number;
  avgDaysLate: number;
  partialPaymentCount: number;
  consecutiveMissed: number;
  monthsSinceLastPayment: number;
  totalOutstanding: number;
}

@Injectable()
export class FeePredictionService {
  private readonly logger = new Logger(FeePredictionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate fee defaulter risk score for a student using rule-based scoring.
   * This acts as the MVP before an XGBoost model is trained on real data.
   */
  async predictRisk(tenantId: string, studentId: string): Promise<{
    riskScore: number;
    riskCategory: RiskCategory;
    features: PaymentFeatures;
  }> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, studentId, issuedAt: { gte: twelveMonthsAgo } },
      include: { payments: { where: { status: 'SUCCESS' } } },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    let latePaymentCount = 0;
    let partialPaymentCount = 0;
    let consecutiveMissed = 0;
    let maxConsecutive = 0;
    let totalDaysLate = 0;
    let latePaidCount = 0;
    let totalOutstanding = 0;

    for (const inv of invoices) {
      const paidAt = inv.paidAt;
      const dueDate = inv.dueDate;
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);

      if (paidAt && paidAt > dueDate) {
        latePaymentCount++;
        totalDaysLate += Math.floor((paidAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        latePaidCount++;
        consecutiveMissed = 0;
      } else if (inv.status === 'PENDING' || inv.status === 'OVERDUE') {
        if (dueDate < now) {
          consecutiveMissed++;
          maxConsecutive = Math.max(maxConsecutive, consecutiveMissed);
          totalOutstanding += outstanding;
        }
      } else if (inv.status === 'PARTIAL') {
        partialPaymentCount++;
        consecutiveMissed = 0;
        totalOutstanding += outstanding;
      } else {
        consecutiveMissed = 0;
      }
    }

    const lastPaid = invoices.filter((i) => i.paidAt).pop();
    const monthsSinceLastPayment = lastPaid?.paidAt
      ? Math.floor((now.getTime() - lastPaid.paidAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
      : invoices.length > 0 ? 6 : 0;

    const features: PaymentFeatures = {
      latePaymentCount,
      latePaymentRate: invoices.length > 0 ? latePaymentCount / invoices.length : 0,
      avgDaysLate: latePaidCount > 0 ? totalDaysLate / latePaidCount : 0,
      partialPaymentCount,
      consecutiveMissed: maxConsecutive,
      monthsSinceLastPayment,
      totalOutstanding,
    };

    // Weighted rule-based score (0–1)
    const score = Math.min(
      features.latePaymentRate * 0.35 +
      Math.min(features.consecutiveMissed / 3, 1) * 0.25 +
      Math.min(features.avgDaysLate / 60, 1) * 0.20 +
      Math.min(features.partialPaymentCount / 5, 1) * 0.12 +
      Math.min(features.monthsSinceLastPayment / 3, 1) * 0.08,
      1,
    );

    let riskCategory: RiskCategory = 'LOW';
    if (score >= 0.7) riskCategory = 'CRITICAL';
    else if (score >= 0.5) riskCategory = 'HIGH';
    else if (score >= 0.3) riskCategory = 'MEDIUM';

    return { riskScore: Math.round(score * 10000) / 10000, riskCategory, features };
  }

  /**
   * Run predictions for all active students in a tenant and persist results.
   */
  async runTenantPredictions(tenantId: string): Promise<void> {
    const students = await this.prisma.student.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true },
    });

    this.logger.log(`Running fee predictions for ${students.length} students in tenant ${tenantId}`);

    for (const student of students) {
      try {
        const result = await this.predictRisk(tenantId, student.id);
        await this.prisma.feeDefaulterRisk.upsert({
          where: { studentId: student.id },
          update: {
            riskScore: result.riskScore,
            riskCategory: result.riskCategory,
            features: result.features as never,
            predictedAt: new Date(),
          },
          create: {
            tenantId,
            studentId: student.id,
            riskScore: result.riskScore,
            riskCategory: result.riskCategory,
            features: result.features as never,
          },
        });
      } catch (err) {
        this.logger.error(`Prediction failed for student ${student.id}`, err);
      }
    }
  }
}
