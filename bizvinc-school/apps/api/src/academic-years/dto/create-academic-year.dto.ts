import { IsBoolean, IsISO8601, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAcademicYearDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsISO8601() startDate: string;
  @ApiProperty() @IsISO8601() endDate: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCurrent?: boolean;
}

export class CreateTermDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsISO8601() startDate: string;
  @ApiProperty() @IsISO8601() endDate: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isCurrent?: boolean;
}
