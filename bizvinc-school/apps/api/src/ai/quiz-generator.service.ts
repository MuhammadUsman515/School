import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Difficulty, QuestionType } from '@prisma/client';
import OpenAI from 'openai';

interface GenerateQuizParams {
  topic: string;
  subject: string;
  grade: string;
  count: number;
  difficulty: Difficulty;
  questionTypes: QuestionType[];
  tenantId: string;
  subjectId?: string;
}

interface GeneratedQuestion {
  question: string;
  questionType: QuestionType;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: Difficulty;
}

@Injectable()
export class QuizGeneratorService {
  private readonly logger = new Logger(QuizGeneratorService.name);
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultQuery: { 'api-version': process.env.OPENAI_API_VERSION || '2024-02-01' },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
    });
  }

  /**
   * Generate quiz questions using LLM based on topic and parameters.
   * Saves generated questions to the question bank.
   */
  async generateQuiz(params: GenerateQuizParams): Promise<GeneratedQuestion[]> {
    const prompt = `Generate exactly ${params.count} quiz questions for:
- Subject: ${params.subject}
- Grade: ${params.grade}
- Topic: ${params.topic}
- Difficulty: ${params.difficulty}
- Question types: ${params.questionTypes.join(', ')}

Return a valid JSON array. Each object must have:
{
  "question": "string",
  "questionType": "MCQ|TRUE_FALSE|SHORT_ANSWER|FILL_IN_BLANK",
  "options": ["A", "B", "C", "D"] (only for MCQ),
  "correctAnswer": "string",
  "explanation": "string"
}

Return ONLY the JSON array, no extra text.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content ?? '{"questions":[]}';
      const parsed = JSON.parse(content);
      const questions: GeneratedQuestion[] = parsed.questions ?? parsed;

      // Save to question bank if subjectId provided
      if (params.subjectId && Array.isArray(questions)) {
        await this.prisma.questionBankItem.createMany({
          data: questions.map((q) => ({
            tenantId: params.tenantId,
            subjectId: params.subjectId!,
            question: q.question,
            questionType: q.questionType || 'MCQ',
            options: q.options ? { choices: q.options } : undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: params.difficulty,
            topic: params.topic,
            aiGenerated: true,
          })),
        });
      }

      return questions.map((q) => ({ ...q, difficulty: params.difficulty }));
    } catch (err) {
      this.logger.error('Quiz generation error', err);
      return [];
    }
  }

  /**
   * Generate a structured lesson plan for a given topic.
   */
  async generateLessonPlan(params: {
    topic: string;
    subject: string;
    grade: string;
    durationMinutes: number;
    objectives: string[];
  }): Promise<Record<string, unknown>> {
    const prompt = `Create a detailed lesson plan as JSON:
Subject: ${params.subject}, Grade: ${params.grade}, Topic: ${params.topic}
Duration: ${params.durationMinutes} minutes
Learning objectives: ${params.objectives.join('; ')}

Return JSON with: { "title", "duration", "objectives": [], "introduction": "", "mainActivity": "", "assessment": "", "differentiation": "", "resources": [], "homework": "" }`;

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(content);
    } catch (err) {
      this.logger.error('Lesson plan generation error', err);
      return {};
    }
  }
}
