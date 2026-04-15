import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeeStructureDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty({ enum: ['TUITION','REGISTRATION','ACTIVITY','LAB','TRANSPORT','HOSTEL','EXAM','LIBRARY','UNIFORM','OTHER'] })
  @IsEnum(['TUITION','REGISTRATION','ACTIVITY','LAB','TRANSPORT','HOSTEL','EXAM','LIBRARY','UNIFORM','OTHER'])
  feeType: string;

  @ApiProperty({ enum: ['MONTHLY','QUARTERLY','SEMI_ANNUAL','ANNUAL','ONE_TIME'] })
  @IsEnum(['MONTHLY','QUARTERLY','SEMI_ANNUAL','ANNUAL','ONE_TIME'])
  frequency: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() classId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() academicYearId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}
