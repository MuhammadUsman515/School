import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsNumber, IsOptional } from 'class-validator';
import { ChatbotService } from './chatbot.service';
import { QuizGeneratorService } from './quiz-generator.service';
import { FeePredictionService } from './fee-prediction.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { Difficulty, QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

class ChatDto {
  @IsString() message: string;
}

class GenerateQuizDto {
  @IsString() topic: string;
  @IsString() subject: string;
  @IsString() grade: string;
  @IsNumber() count: number;
  @IsEnum(Difficulty) difficulty: Difficulty;
  @IsArray() questionTypes: QuestionType[];
  @IsOptional() @IsString() subjectId?: string;
}

class GenerateLessonPlanDto {
  @IsString() topic: string;
  @IsString() subject: string;
  @IsString() grade: string;
  @IsNumber() durationMinutes: number;
  @IsArray() objectives: string[];
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private chatbot: ChatbotService,
    private quizGenerator: QuizGeneratorService,
    private feePredictor: FeePredictionService,
    private prisma: PrismaService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Parent/student chatbot (RAG-based)' })
  chat(@TenantId() tenantId: string, @Body() dto: ChatDto) {
    return this.chatbot.chat(dto.message, tenantId).then((reply) => ({ reply }));
  }

  @Post('generate-quiz')
  @ApiOperation({ summary: 'AI quiz question generator' })
  generateQuiz(@TenantId() tenantId: string, @Body() dto: GenerateQuizDto) {
    return this.quizGenerator.generateQuiz({ ...dto, tenantId });
  }

  @Post('generate-lesson-plan')
  @ApiOperation({ summary: 'AI lesson plan generator' })
  generateLessonPlan(@Body() dto: GenerateLessonPlanDto) {
    return this.quizGenerator.generateLessonPlan(dto);
  }

  @Get('defaulter-risks')
  @ApiOperation({ summary: 'Get all fee defaulter risk predictions' })
  async getDefaulterRisks(@TenantId() tenantId: string) {
    return this.prisma.feeDefaulterRisk.findMany({
      where: { tenantId },
      include: {
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
      },
      orderBy: { riskScore: 'desc' },
    });
  }

  @Post('run-predictions')
  @ApiOperation({ summary: 'Trigger fee defaulter predictions for all students' })
  runPredictions(@TenantId() tenantId: string) {
    // Fire and forget — returns immediately
    this.feePredictor.runTenantPredictions(tenantId).catch(() => {});
    return { message: 'Predictions job started' };
  }

  @Get('weak-areas/:studentId')
  @ApiOperation({ summary: 'Get student weak areas' })
  getWeakAreas(@TenantId() tenantId: string, @Param('studentId') studentId: string) {
    return this.prisma.studentWeakArea.findMany({
      where: { studentId },
      include: { subject: { select: { name: true, color: true } } },
      orderBy: { masteryScore: 'asc' },
    });
  }
}
