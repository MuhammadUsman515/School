import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new school (tenant) with an admin user in a single transaction.
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.schoolSlug } });
    if (existing) {
      throw new ConflictException('A school with this slug already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.schoolName,
        slug: dto.schoolSlug,
        country: dto.country || 'PK',
        users: {
          create: {
            email: dto.email,
            passwordHash,
            role: 'SCHOOL_ADMIN',
            firstName: dto.firstName,
            lastName: dto.lastName,
            emailVerified: false,
          },
        },
      },
      include: { users: true },
    });

    const user = tenant.users[0];
    const tokens = await this.generateTokens(user.id, tenant.id, user.role, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: tenant.id,
      },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      ...tokens,
    };
  }

  /**
   * Validate credentials and return access + refresh tokens.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true },
      include: { tenant: { select: { id: true, name: true, slug: true, status: true } } },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.tenant.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your school account has been suspended');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.tenantId, user.role, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
      },
      tenant: user.tenant,
      ...tokens,
    };
  }

  /**
   * Use a valid refresh token to obtain a new access token.
   */
  async refreshToken(token: string): Promise<TokenPair> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens(
      stored.user.id,
      stored.user.tenantId,
      stored.user.role,
      stored.user.email,
    );
  }

  /**
   * Revoke all refresh tokens for a user (logout).
   */
  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  /**
   * Get the current authenticated user's profile.
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        emailVerified: true,
        mfaEnabled: true,
        tenantId: true,
        createdAt: true,
        tenant: { select: { id: true, name: true, slug: true, plan: true, primaryColor: true, logoUrl: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Update FCM push token for a user device.
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { fcmTokens: true } });
    if (!user) return;

    const tokens = user.fcmTokens.includes(fcmToken)
      ? user.fcmTokens
      : [...user.fcmTokens, fcmToken];

    await this.prisma.user.update({ where: { id: userId }, data: { fcmTokens: tokens } });
  }

  /**
   * Change the authenticated user's password.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    // Revoke all refresh tokens on password change
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async generateTokens(
    userId: string,
    tenantId: string,
    role: string,
    email: string,
  ): Promise<TokenPair> {
    const payload = { sub: userId, tenantId, role, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      }),
      this.generateRefreshToken(userId),
    ]);

    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });

    return token;
  }
}
