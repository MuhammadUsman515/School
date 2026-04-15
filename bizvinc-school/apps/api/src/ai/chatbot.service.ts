import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY || 'sk-placeholder',
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
      defaultQuery: { 'api-version': process.env.OPENAI_API_VERSION || '2024-02-01' },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
    });
  }

  /**
   * RAG-based parent/student chatbot.
   * Searches school knowledge base then answers using LLM.
   */
  async chat(message: string, tenantId: string): Promise<string> {
    try {
      // Retrieve relevant knowledge base articles (simple keyword match for MVP)
      const knowledgeItems = await this.prisma.aIKnowledgeBase.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: message.substring(0, 20), mode: 'insensitive' } },
            { content: { contains: message.substring(0, 20), mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });

      const context = knowledgeItems.length > 0
        ? knowledgeItems.map((k) => `[${k.title}]: ${k.content}`).join('\n\n')
        : 'No specific information found. Please contact the school office for detailed queries.';

      const systemPrompt = `You are a helpful school assistant for ${tenant?.name ?? 'our school'}.
Answer parent and student questions based only on the provided context below.
Be concise, friendly, and professional. If the answer is not in the context, say "Please contact the school office for this information."

Context:
${context}`;

      const response = await this.openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content ?? 'I could not process your request. Please try again.';
    } catch (err) {
      this.logger.error('Chatbot error', err);
      return 'I am currently unavailable. Please contact the school office directly.';
    }
  }
}
