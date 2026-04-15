import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  private s3: S3Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    this.bucket = config.get<string>('AWS_S3_BUCKET', 'bizvinc-school-uploads');
    this.s3 = new S3Client({
      region: config.get<string>('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  async getPresignedUrl(tenantId: string, folder: string, filename: string, mimeType: string) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException(`File type ${mimeType} not allowed`);
    }

    const ext = filename.split('.').pop();
    const key = `${tenantId}/${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const publicUrl = `https://${this.bucket}.s3.amazonaws.com/${key}`;

    return { uploadUrl: url, publicUrl, key };
  }
}
