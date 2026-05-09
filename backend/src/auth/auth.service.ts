import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Profile } from '@prisma/client';
import { UserService } from '../user/user.service';
import { MessagingService } from '../messaging/messaging.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=(?:.*\d){4,})(?=.*[^a-zA-Z0-9]).{8,}$/;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly messagingService: MessagingService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (!PASSWORD_REGEX.test(dto.password)) {
      throw new BadRequestException(
        'Password must have at least 8 characters, 1 uppercase, 1 lowercase, 4 numbers and 1 special character',
      );
    }

    const isUfba = dto.email.endsWith('@ufba.br');
    let profile: Profile;
    let isActive: boolean;

    if (isUfba) {
      if (!dto.registrationNumber) {
        throw new BadRequestException(
          'Registration number is required for UFBA emails',
        );
      }
      if (
        !dto.profile ||
        (dto.profile !== Profile.DoctoralStudent &&
          dto.profile !== Profile.Professor)
      ) {
        throw new BadRequestException(
          'Profile must be DoctoralStudent or Professor for UFBA emails',
        );
      }
      profile = dto.profile;
      isActive = profile !== Profile.Professor;
    } else {
      profile = Profile.Listener;
      isActive = true;
    }

    const user = await this.userService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      registrationNumber: dto.registrationNumber,
      profile,
    });

    if (!isActive) {
      await this.prisma.userAccount.update({
        where: { id: user.id },
        data: { isActive: false },
      });
    }

    const token = randomUUID();
    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        emailVerificationToken: token,
        emailVerificationSentAt: new Date(),
      },
    });

    await this.messagingService.publish('email-send', {
      email: dto.email,
      name: dto.name,
      token,
    });

    return { message: 'Registration successful. Please verify your email.' };
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { emailVerifiedAt: new Date() },
    });

    await this.prisma.userAccount.update({
      where: { id: verification.userId },
      data: { isVerified: true },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If the email exists, a verification link was sent.' };
    }

    const verification = await this.prisma.emailVerification.findUnique({
      where: { userId: user.id },
    });

    if (!verification) {
      return { message: 'If the email exists, a verification link was sent.' };
    }

    const newToken = randomUUID();
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        emailVerificationToken: newToken,
        emailVerificationSentAt: new Date(),
      },
    });

    await this.messagingService.publish('email-send', {
      email: user.email,
      name: user.name,
      token: newToken,
    });

    return { message: 'If the email exists, a verification link was sent.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Confirme seu e-mail');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Aguardando aprovação');
    }

    const payload = {
      sub: user.id,
      profile: user.profile,
      level: user.level,
    };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        level: user.level,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      const token = this.jwtService.sign(
        { sub: user.id, type: 'password-reset' },
        { expiresIn: '1h' },
      );

      await this.messagingService.publish('email-send', {
        email: user.email,
        name: user.name,
        token,
        type: 'password-reset',
      });
    }

    return { message: 'If the email exists, a password reset link was sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (!PASSWORD_REGEX.test(dto.password)) {
      throw new BadRequestException(
        'Password must have at least 8 characters, 1 uppercase, 1 lowercase, 4 numbers and 1 special character',
      );
    }

    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify<{ sub: string; type: string }>(
        dto.token,
        { secret: this.configService.get<string>('JWT_SECRET') },
      );
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.type !== 'password-reset') {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const saltRounds = parseInt(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
      10,
    );
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    await this.prisma.userAccount.update({
      where: { id: payload.sub },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.userAccount.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const committeeMember = await this.prisma.committeeMember.findFirst({
      where: {
        userId,
        eventEdition: {
          isActive: true,
          endDate: { gte: new Date() },
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.profile,
      level: user.level,
      isCommitteeOfActiveEdition: !!committeeMember,
    };
  }
}
