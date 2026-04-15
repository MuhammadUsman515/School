import { Module } from '@nestjs/common';
import { FeeStructuresService } from './fee-structures.service';
import { FeeStructuresController } from './fee-structures.controller';

@Module({
  controllers: [FeeStructuresController],
  providers: [FeeStructuresService],
})
export class FeeStructuresModule {}
