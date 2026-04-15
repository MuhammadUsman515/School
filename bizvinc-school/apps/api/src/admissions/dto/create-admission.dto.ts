import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAdmissionDto {
  @ApiProperty() @IsString() applicantName: string;
  @ApiProperty() @IsEmail() applicantEmail: string;
  @ApiPropertyOptional() @IsOptional() @IsString() applicantPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() appliedGrade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() academicYearId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateAdmissionStatusDto {
  @ApiProperty({
    enum: ['INQUIRY','APPLIED','DOCUMENTS_PENDING','SHORTLISTED','ACCEPTED','ENROLLED','REJECTED','WAITLISTED','WITHDRAWN'],
  })
  @IsEnum(['INQUIRY','APPLIED','DOCUMENTS_PENDING','SHORTLISTED','ACCEPTED','ENROLLED','REJECTED','WAITLISTED','WITHDRAWN'])
  status: string;

  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
