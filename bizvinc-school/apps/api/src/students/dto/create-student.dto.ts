import {
  IsString, IsEmail, IsDateString, IsEnum, IsOptional,
  IsArray, MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(8) password: string;
  @ApiProperty() @IsDateString() dateOfBirth: string;
  @ApiProperty({ enum: Gender }) @IsEnum(Gender) gender: Gender;
  @ApiProperty({ required: false }) @IsOptional() @IsString() nationality?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() religion?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() bloodGroup?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() city?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() medicalNotes?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsArray() allergies?: string[];
  @ApiProperty({ required: false }) @IsOptional() classId?: string;
}
