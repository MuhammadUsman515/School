import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSlotDto {
  @ApiProperty() @IsUUID() classId: string;
  @ApiProperty() @IsUUID() subjectId: string;
  @ApiProperty() @IsUUID() teacherId: string;

  @ApiProperty({ enum: ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'] })
  @IsEnum(['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'])
  dayOfWeek: string;

  @ApiProperty() @IsNumber() @Min(1) @Max(12) periodNumber: number;
  @ApiProperty() @IsString() startTime: string;
  @ApiProperty() @IsString() endTime: string;
  @ApiPropertyOptional() @IsOptional() @IsString() room?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() academicYearId?: string;
}
