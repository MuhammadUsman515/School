import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant.decorator';
import { UploadsService } from './uploads.service';
import { ApiProperty } from '@nestjs/swagger';

class PresignedUrlDto {
  @ApiProperty() @IsString() folder: string;
  @ApiProperty() @IsString() filename: string;
  @ApiProperty() @IsString() mimeType: string;
}

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  getPresignedUrl(@TenantId() tenantId: string, @Body() dto: PresignedUrlDto) {
    return this.uploadsService.getPresignedUrl(tenantId, dto.folder, dto.filename, dto.mimeType);
  }
}
