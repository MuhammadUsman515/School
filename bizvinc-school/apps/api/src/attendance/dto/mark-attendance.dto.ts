import { IsString, IsDateString, IsEnum, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceRecordDto {
  @ApiProperty() @IsString() studentId: string;
  @ApiProperty({ enum: AttendanceStatus }) @IsEnum(AttendanceStatus) status: AttendanceStatus;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}

export class MarkAttendanceDto {
  @ApiProperty() @IsString() classId: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() period?: number;
  @ApiProperty({ type: [AttendanceRecordDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
