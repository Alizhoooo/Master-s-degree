import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger('EmailService');
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('app.smtpHost');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('app.smtpPort', 587),
        secure: this.configService.get<boolean>('app.smtpSecure', false),
        auth: {
          user: this.configService.get<string>('app.smtpUser'),
          pass: this.configService.get<string>('app.smtpPass'),
        },
      });
      this.logger.log('SMTP transport initialized');
    } else {
      this.logger.warn('SMTP not configured. Emails will be logged only.');
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    const subject = 'SupplyFlow — Password Reset';
    const text = `You requested a password reset.\n\nClick the link to reset your password (valid for 1 hour):\n${resetUrl}\n\nIf you didn't request this, please ignore this email.`;

    if (this.transporter) {
      const from = this.configService.get<string>('app.smtpFrom', 'noreply@supplyflow.kz');
      await this.transporter.sendMail({ from, to, subject, text });
      this.logger.log(`Password reset email sent to ${to}`);
    } else {
      this.logger.log(`[EMAIL LOG] To: ${to}, Subject: ${subject}, URL: ${resetUrl}`);
    }
  }

  async sendTotpResetEmail(to: string, adminEmail: string): Promise<void> {
    const subject = 'SupplyFlow — 2FA Reset Notification';
    const text = `Your 2FA has been reset.\n\nIf you did not authorize this, please contact your administrator at ${adminEmail}.`;

    if (this.transporter) {
      const from = this.configService.get<string>('app.smtpFrom', 'noreply@supplyflow.kz');
      await this.transporter.sendMail({ from, to, subject, text });
    } else {
      this.logger.log(`[EMAIL LOG] To: ${to}, Subject: ${subject}`);
    }
  }
}
