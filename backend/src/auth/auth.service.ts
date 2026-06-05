import { Injectable, ConflictException, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 8;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const RESET_TOKEN_EXPIRY_HOURS = 1;

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  private validatePasswordPolicy(password: string): void {
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>_-]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character');
    }
  }

  private async checkLockout(user: any): Promise<void> {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${remainingMin} minutes`);
    }
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }
  }

  private async recordFailedAttempt(userId: number): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) },
      });
      this.logger.warn(`User ${user.email} locked out after ${MAX_LOGIN_ATTEMPTS} failed attempts`);
    }
  }

  private generateAccessToken(user: any): string {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      fullName: user.fullName,
      totpVerified: false,
    };
    return this.jwtService.sign(payload);
  }

  private async generateRefreshToken(userId: number, userAgent?: string, ipAddress?: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { token, userId, userAgent, ipAddress, expiresAt },
    });
    return token;
  }

  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    await this.checkLockout(user);

    if (!user.active) throw new UnauthorizedException('Account is deactivated');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.recordFailedAttempt(user.id);
      const remaining = MAX_LOGIN_ATTEMPTS - user.failedLoginAttempts - 1;
      const msg = remaining > 0
        ? `Invalid credentials. ${remaining} attempt(s) remaining`
        : 'Invalid credentials. Account locked for 15 minutes';
      throw new UnauthorizedException(msg);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id, userAgent, ipAddress);

    const { password: _, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser, requiresTotp: user.totpEnabled };
  }

  async loginVerifyTotp(userId: number, totpCode: string, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) throw new UnauthorizedException('Invalid 2FA setup');

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });
    if (!verified) throw new UnauthorizedException('Invalid 2FA code');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id, userAgent, ipAddress);

    const { password: _, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
  }

  async refreshAccessToken(refreshTokenStr: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshTokenStr } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || !user.active) throw new UnauthorizedException('User not found or inactive');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user.id, stored.userAgent, stored.ipAddress);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshTokenStr: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshTokenStr, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async register(createUserDto: { email: string; password: string; fullName: string; role: string }) {
    this.validatePasswordPolicy(createUserDto.password);

    const existing = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        fullName: createUserDto.fullName,
        role: (createUserDto.role as any) || 'Warehouse',
      },
    });
    const { password: _, ...result } = user;
    return result;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    this.validatePasswordPolicy(newPassword);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
    await this.logoutAll(userId);
    return { message: 'Password changed successfully' };
  }

  // ── 2FA ──

  async setupTotp(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const secret = speakeasy.generateSecret({ name: `SupplyFlow:${user.email}` });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: secret.base32, totpEnabled: false },
    });

    return { secret: secret.base32, qrCode };
  }

  async verifyTotpSetup(userId: number, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.totpSecret) throw new BadRequestException('2FA not initialized');

    const verified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!verified) throw new BadRequestException('Invalid 2FA code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
    return { message: '2FA enabled successfully' };
  }

  async disableTotp(userId: number, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new BadRequestException('Password is incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: null, totpEnabled: false },
    });
    return { message: '2FA disabled successfully' };
  }

  // ── Password Reset ──

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const frontendUrl = this.configService.get<string>('app.corsOrigin', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.emailService.sendPasswordResetEmail(email, resetUrl);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}: ${err}`);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    this.validatePasswordPolicy(newPassword);

    const user = await this.prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    await this.logoutAll(user.id);
    return { message: 'Password reset successfully' };
  }

  // ── Sessions ──

  async listSessions(userId: number) {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    });
  }

  async revokeSession(userId: number, sessionId: number) {
    const token = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });
    if (!token) throw new BadRequestException('Session not found');
    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}
