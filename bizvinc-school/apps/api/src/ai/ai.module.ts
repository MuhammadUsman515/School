import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { ChatbotService } from './chatbot.service';
import { QuizGeneratorService } from './quiz-generator.service';
import { FeePredictionService } from './fee-prediction.service';

@Module({
  controllers: [AiController],
  providers: [ChatbotService, QuizGeneratorService, FeePredictionService],
  exports: [ChatbotService, QuizGeneratorService, FeePredictionService],
})
export class AiModule {}
