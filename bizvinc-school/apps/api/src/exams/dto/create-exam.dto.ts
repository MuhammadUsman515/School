import { IsArray, IsEnum, IsISO8601, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() classId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() subjectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() termId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() scheduledAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() durationMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalMarks?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() passingMarks?: number;
}

export class AddExamQuestionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  questionBankItemIds: string[];
}

export class UpdateExamStatusDto {
  @ApiProperty({ enum: ['DRAFT','SCHEDULED','ONGOING','COMPLETED','CANCELLED'] })
  @IsEnum(['DRAFT','SCHEDULED','ONGOING','COMPLETED','CANCELLED'])
  status: string;
}

export class SubmitExamResultDto {
  @ApiProperty() @IsUUID() studentId: string;
  @ApiProperty() @IsNumber() marksObtained: number;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}
