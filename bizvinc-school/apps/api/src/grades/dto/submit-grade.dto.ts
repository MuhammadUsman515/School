import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitGradeDto {
  @ApiProperty() @IsString() studentId: string;
  @ApiProperty() @IsString() classId: string;
  @ApiProperty() @IsString() subjectId: string;
  @ApiProperty() @IsString() termId: string;
  @ApiProperty() @IsNumber() @Min(0) score: number;
  @ApiProperty() @IsNumber() @Min(1) maxScore: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() categoryId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() assignmentId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() examId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() comments?: string;
}
