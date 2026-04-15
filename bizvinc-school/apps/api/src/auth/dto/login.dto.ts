import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@demo.bizvincdemo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Demo@12345' })
  @IsString()
  @MinLength(6)
  password: string;
}
